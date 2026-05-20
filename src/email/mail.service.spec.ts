import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  const mockSendMail = jest.fn();

  beforeEach(async () => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── sendVerificationCode ─────────────────────────────────────────────────────

  describe('sendVerificationCode', () => {
    const email = 'juan@test.com';
    const code = '123456';

    it('llama a sendMail con el email y subject correctos', async () => {
      mockSendMail.mockResolvedValue({});

      await service.sendVerificationCode(email, code);

      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.to).toBe(email);
      expect(callArg.subject).toBe('Código de verificación');
    });

    it('incluye el código en el html del correo', async () => {
      mockSendMail.mockResolvedValue({});

      await service.sendVerificationCode(email, code);

      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.html).toContain(code);
    });

    it('llama a sendMail exactamente una vez', async () => {
      mockSendMail.mockResolvedValue({});

      await service.sendVerificationCode(email, code);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('lanza InternalServerErrorException si sendMail falla', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(service.sendVerificationCode(email, code)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('lanza el mensaje correcto cuando falla el envío', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(service.sendVerificationCode(email, code)).rejects.toThrow(
        'Error al enviar el correo de verificación.',
      );
    });

    it('no lanza excepción cuando el envío es exitoso', async () => {
      mockSendMail.mockResolvedValue({});

      await expect(
        service.sendVerificationCode(email, code),
      ).resolves.not.toThrow();
    });
  });
});