import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  const mockNotificationService = {
    getByUser: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  afterEach(() => jest.clearAllMocks());

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  // ─── getByUser ────────────────────────────────────────────────────────────────

  describe('getByUser', () => {
    it('retorna las notificaciones del usuario', async () => {
      const mockData = [{ title: 'Test', read: false }];
      mockNotificationService.getByUser.mockResolvedValue(mockData);

      const result = await controller.getByUser('user-id-123');

      expect(result).toEqual(mockData);
      expect(mockNotificationService.getByUser).toHaveBeenCalledWith('user-id-123');
    });

    it('llama al servicio con el userId del query param', async () => {
      mockNotificationService.getByUser.mockResolvedValue([]);

      await controller.getByUser('abc123');

      expect(mockNotificationService.getByUser).toHaveBeenCalledWith('abc123');
      expect(mockNotificationService.getByUser).toHaveBeenCalledTimes(1);
    });
  });

  // ─── markAsRead ───────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('marca una notificación como leída y retorna el resultado', async () => {
      const updated = { _id: 'notif-id', read: true };
      mockNotificationService.markAsRead.mockResolvedValue(updated);

      const result = await controller.markAsRead('notif-id');

      expect(result).toEqual(updated);
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif-id');
    });

    it('llama al servicio con el id del param', async () => {
      mockNotificationService.markAsRead.mockResolvedValue({});

      await controller.markAsRead('xyz');

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('xyz');
      expect(mockNotificationService.markAsRead).toHaveBeenCalledTimes(1);
    });
  });

  // ─── markAllAsRead ────────────────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('marca todas las notificaciones del usuario como leídas', async () => {
      const updateResult = { modifiedCount: 3 };
      mockNotificationService.markAllAsRead.mockResolvedValue(updateResult);

      const result = await controller.markAllAsRead('user-id-123');

      expect(result).toEqual(updateResult);
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith('user-id-123');
    });

    it('llama al servicio con el userId del param', async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue({});

      await controller.markAllAsRead('abc123');

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith('abc123');
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledTimes(1);
    });
  });
});