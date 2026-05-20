import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationService } from './notification.service';
import { Notification } from './schemas/notification.schema';
import { Types } from 'mongoose';

const mockNotificationModel = {
  insertMany: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateMany: jest.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── createMany ───────────────────────────────────────────────────────────────

  describe('createMany', () => {
    const userId = new Types.ObjectId();
    const items = [
      { title: 'Bienvenido', message: 'Hola!' },
      { title: 'Completa tu perfil', message: 'Agrega tus datos.' },
    ];

    it('llama a insertMany con los documentos correctos', async () => {
      mockNotificationModel.insertMany.mockResolvedValue([]);

      await service.createMany(userId, items);

      expect(mockNotificationModel.insertMany).toHaveBeenCalledWith(
        items.map((n) => ({ userId, ...n, read: false })),
      );
    });

    it('llama a insertMany exactamente una vez', async () => {
      mockNotificationModel.insertMany.mockResolvedValue([]);

      await service.createMany(userId, items);

      expect(mockNotificationModel.insertMany).toHaveBeenCalledTimes(1);
    });

    it('marca todas las notificaciones como read: false', async () => {
      mockNotificationModel.insertMany.mockResolvedValue([]);

      await service.createMany(userId, items);

      const docs = mockNotificationModel.insertMany.mock.calls[0][0];
      docs.forEach((doc: any) => expect(doc.read).toBe(false));
    });
  });

  // ─── getByUser ────────────────────────────────────────────────────────────────

  describe('getByUser', () => {
    const userId = new Types.ObjectId().toString();

    it('retorna las notificaciones del usuario', async () => {
      const mockData = [{ title: 'Test', read: false }];
      mockNotificationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockData),
      });

      const result = await service.getByUser(userId);

      expect(result).toEqual(mockData);
    });

    it('llama a find con el userId convertido a ObjectId', async () => {
      mockNotificationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      await service.getByUser(userId);

      const callArg = mockNotificationModel.find.mock.calls[0][0];
      expect(callArg.userId).toBeInstanceOf(Types.ObjectId);
      expect(callArg.userId.toString()).toBe(userId);
    });

    it('ordena por createdAt descendente', async () => {
      const sortMock = jest.fn().mockReturnThis();
      mockNotificationModel.find.mockReturnValue({
        sort: sortMock,
        lean: jest.fn().mockResolvedValue([]),
      });

      await service.getByUser(userId);

      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  // ─── markAsRead ───────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    const notifId = new Types.ObjectId().toString();

    it('llama a findByIdAndUpdate con los parámetros correctos', async () => {
      mockNotificationModel.findByIdAndUpdate.mockResolvedValue({ read: true });

      await service.markAsRead(notifId);

      expect(mockNotificationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        notifId,
        { read: true },
        { new: true },
      );
    });

    it('retorna la notificación actualizada', async () => {
      const updated = { _id: notifId, read: true };
      mockNotificationModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.markAsRead(notifId);

      expect(result).toEqual(updated);
    });
  });

  // ─── markAllAsRead ────────────────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    const userId = new Types.ObjectId().toString();

    it('llama a updateMany con userId como ObjectId y read: false', async () => {
      mockNotificationModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

      await service.markAllAsRead(userId);

      const callArg = mockNotificationModel.updateMany.mock.calls[0][0];
      expect(callArg.userId).toBeInstanceOf(Types.ObjectId);
      expect(callArg.userId.toString()).toBe(userId);
      expect(callArg.read).toBe(false);
    });

    it('actualiza solo las notificaciones con read: false', async () => {
      mockNotificationModel.updateMany.mockResolvedValue({ modifiedCount: 3 });

      await service.markAllAsRead(userId);

      const [filter] = mockNotificationModel.updateMany.mock.calls[0];
      expect(filter.read).toBe(false);
    });

    it('retorna el resultado de updateMany', async () => {
      const updateResult = { modifiedCount: 2 };
      mockNotificationModel.updateMany.mockResolvedValue(updateResult);

      const result = await service.markAllAsRead(userId);

      expect(result).toEqual(updateResult);
    });
  });
});