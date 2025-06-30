import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { loadImage, createCanvas } from 'canvas';
import multiavatar from '@multiavatar/multiavatar';

@Injectable()
export class PlaygroundService {
  constructor(private readonly prismaService: PrismaService) {}

  async generateRandomAvatar(): Promise<string> {
    const seed = Math.random().toString(36).substring(2, 10);
    const svg = multiavatar(seed, true);
    const fixedSvg = svg.replace('<svg', '<svg width="64" height="64"');

    const svgBase64 = Buffer.from(fixedSvg).toString('base64');
    const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;
    const img = await loadImage(svgUrl);

    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 64, 64);

    const base64 = canvas.toDataURL('image/png');
    return base64;
  }
}
