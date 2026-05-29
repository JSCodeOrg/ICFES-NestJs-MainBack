import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  private buildVerificationHtml(code: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333;">Verifica tu correo electrónico</h2>
      <p style="color: #555;">Usa el siguiente código para completar tu registro. Expira en <strong>10 minutos</strong>.</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #4F46E5; text-align: center; padding: 24px 0;">
        ${code}
      </div>
      <p style="color: #999; font-size: 12px;">Si no solicitaste esto, ignora este correo.</p>
    </div>
  `;
}

async sendVerificationCode(email: string, code: string): Promise<void> {
  try {
    await this.transporter.sendMail({
      from: `"Dashboard Icfes" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Código de verificación',
      html: this.buildVerificationHtml(code),
    });
  } catch (error) {
    console.error('ERROR NODEMAILER:', error);
    throw new InternalServerErrorException('Error al enviar el correo de verificación.');
  }
}

async resendVerificationCode(email: string, code: string): Promise<void> {
  try {
    await this.transporter.sendMail({
      from: `"Dashboard Icfes" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Código de verificación',
      html: this.buildVerificationHtml(code),
    });
  } catch (error) {
    console.error('ERROR NODEMAILER:', error);
    throw new InternalServerErrorException('Error al reenviar el correo de verificación.');
  }
}


}