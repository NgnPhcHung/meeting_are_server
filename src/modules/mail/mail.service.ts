import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'nphbo1998@gmail.com',
        pass: process.env.GMAIL_PASSWORD,
      },
    });
  }

  async sendEmail({
    to,
    subject,
    html,
  }: {
    to: string | string[];
    subject: string;
    html: string;
  }) {
    const mailOptions = {
      from: 'nphbo1998@gmail.com',
      to,
      subject,
      text: 'Your plain-text fallback content here.',
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (err) {
      console.error('Failed to send email:', err);
      throw err;
    }
  }
}
