import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CacheService } from './cache.service';
import { ConsultaRapida } from './schema/cache_consultas';

const mockCacheModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
};

describe('CacheService', () => {
    let service: CacheService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CacheService,
                {
                    provide: getModelToken(ConsultaRapida.name),
                    useValue: mockCacheModel,
                },
            ],
        }).compile();

        service = module.get<CacheService>(CacheService);
        jest.clearAllMocks();
    });

    describe('get', () => {
        it('debería retornar el cache si existe', async () => {
            const mockDoc = { tipo: 'test', params: '{}', resultado: [{ data: 1 }] };
            mockCacheModel.findOne.mockResolvedValue(mockDoc);

            const result = await service.get('test', {});

            expect(result).toEqual(mockDoc);
            expect(mockCacheModel.findOne).toHaveBeenCalledWith({
                tipo: 'test',
                params: '{}',
            });
        });

        it('debería retornar null si no existe', async () => {
            mockCacheModel.findOne.mockResolvedValue(null);

            const result = await service.get('test', {});

            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('debería guardar el resultado correctamente', async () => {
            const mockDoc = { tipo: 'test', params: '{}', resultado: [{ data: 1 }] };
            mockCacheModel.findOneAndUpdate.mockResolvedValue(mockDoc);

            const result = await service.set('test', {}, [{ data: 1 }]);

            expect(result).toEqual(mockDoc);
            expect(mockCacheModel.findOneAndUpdate).toHaveBeenCalledWith(
                { tipo: 'test', params: '{}' },
                { resultado: [{ data: 1 }] },
                { upsert: true, new: true }
            );
        });
    });

    describe('remember', () => {
        it('debería retornar del cache si existe', async () => {
            const mockDoc = { resultado: [{ data: 1 }] };
            mockCacheModel.findOne.mockResolvedValue(mockDoc);

            const fn = jest.fn();
            const result = await service.remember('test', {}, fn);

            expect(result).toEqual(mockDoc.resultado);
            expect(fn).not.toHaveBeenCalled();
        });

        it('debería calcular y guardar si no existe cache', async () => {
            const mockData = [{ data: 1 }];
            mockCacheModel.findOne.mockResolvedValue(null);
            mockCacheModel.findOneAndUpdate.mockResolvedValue({ resultado: mockData });

            const fn = jest.fn().mockResolvedValue(mockData);
            const result = await service.remember('test', {}, fn);

            expect(result).toEqual(mockData);
            expect(fn).toHaveBeenCalledTimes(1);
            expect(mockCacheModel.findOneAndUpdate).toHaveBeenCalled();
        });

        it('debería distinguir entre distintos params', async () => {
            mockCacheModel.findOne.mockResolvedValue(null);
            mockCacheModel.findOneAndUpdate.mockResolvedValue({});

            const fn = jest.fn().mockResolvedValue([]);

            await service.remember('test', { ano: 2018 }, fn);
            await service.remember('test', { ano: 2019 }, fn);

            expect(mockCacheModel.findOne).toHaveBeenNthCalledWith(1, {
                tipo: 'test',
                params: '{"ano":2018}',
            });
            expect(mockCacheModel.findOne).toHaveBeenNthCalledWith(2, {
                tipo: 'test',
                params: '{"ano":2019}',
            });
        });
    });
});