import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class StorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBase: string;
  private readonly localDir: string;
  private readonly useLocal: boolean;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('R2_BUCKET') ?? 'dentacollab';
    this.publicBase = this.config.get<string>('R2_PUBLIC_URL') ?? '';
    this.localDir = this.config.get<string>('LOCAL_UPLOAD_DIR') ?? join(process.cwd(), 'uploads');
    const endpoint = this.config.get<string>('R2_ENDPOINT');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.useLocal = !endpoint || !accessKeyId || !secretAccessKey;

    this.client = this.useLocal
      ? null
      : new S3Client({
          region: 'auto',
          endpoint,
          credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
        });
  }

  async upload(file: Express.Multer.File, folder = 'media') {
    const ext = file.originalname.includes('.')
      ? file.originalname.slice(file.originalname.lastIndexOf('.'))
      : '';
    const key = `${folder}/${randomUUID()}${ext}`;

    if (this.useLocal || !this.client) {
      const full = join(this.localDir, key);
      await mkdir(join(this.localDir, folder), { recursive: true });
      await writeFile(full, file.buffer);
      const base = this.config.get<string>('API_PUBLIC_URL') ?? 'http://localhost:3000';
      return { key, url: `${base}/uploads/${key}`, size: file.size, mimeType: file.mimetype };
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    const url = this.publicBase ? `${this.publicBase}/${key}` : key;
    return { key, url, size: file.size, mimeType: file.mimetype };
  }

  async remove(key: string) {
    if (this.useLocal || !this.client) {
      try {
        await unlink(join(this.localDir, key));
      } catch {
        /* ignore */
      }
      return;
    }
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
