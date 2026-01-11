import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Configuration } from '../../config/configuration';

type ObjectStorageConfig = Configuration['objectStorage'];

@Injectable()
export class ObjectStorageService {
  private readonly config: ObjectStorageConfig;
  private readonly client: S3Client;
  private readonly logger = new Logger(ObjectStorageService.name);

  constructor(configService: ConfigService<Configuration, true>) {
    this.config = configService.get('objectStorage', { infer: true });
    this.client = new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint,
      forcePathStyle: this.config.forcePathStyle,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
    });
  }

  getDefaultBucket(): string {
    return this.config.bucket;
  }

  normalizeObjectKey(key?: string | null): string | null {
    if (typeof key !== 'string') {
      return null;
    }
    const trimmed = key.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed.replace(/^\/+/, '');
  }

  getPublicUrl(
    objectKey?: string | null,
    bucket?: string | null,
  ): string | null {
    const normalizedKey = this.normalizeObjectKey(objectKey);
    if (!normalizedKey) {
      return null;
    }
    const targetBucket =
      this.normalizeBucket(bucket) ?? this.getDefaultBucket();
    const baseUrl = this.buildBaseUrl(targetBucket);
    if (!baseUrl) {
      return `/${targetBucket}/${normalizedKey}`;
    }
    return `${baseUrl.replace(/\/$/, '')}/${normalizedKey}`;
  }

  async uploadObject(options: {
    objectKey: string;
    body: Buffer | Uint8Array | string;
    bucket?: string | null;
    contentType?: string;
    metadata?: Record<string, string>;
  }): Promise<{ bucket: string; objectKey: string }> {
    const bucketName =
      this.normalizeBucket(options.bucket) ?? this.getDefaultBucket();
    const normalizedKey = this.normalizeObjectKey(options.objectKey);

    if (!normalizedKey) {
      throw new Error('Cannot upload object without a valid object key');
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: normalizedKey,
        Body: options.body,
        ContentType: options.contentType,
        Metadata: options.metadata,
      }),
    );

    this.logger.debug(
      `Uploaded object ${normalizedKey} to bucket ${bucketName}`,
    );

    return { bucket: bucketName, objectKey: normalizedKey };
  }

  private normalizeBucket(bucket?: string | null): string | null {
    if (typeof bucket !== 'string') {
      return null;
    }
    const trimmed = bucket.trim();
    return trimmed.length ? trimmed : null;
  }

  private buildBaseUrl(bucket: string): string | null {
    if (this.config.publicBaseUrl) {
      const template = this.config.publicBaseUrl.replace(/\/$/, '');
      return template.replace('{bucket}', bucket);
    }

    if (this.config.driver === 's3') {
      const region = this.config.region || 'us-east-1';
      return `https://${bucket}.s3.${region}.amazonaws.com`;
    }

    if (this.config.endpoint) {
      const endpoint = this.config.endpoint.replace(/\/$/, '');
      if (this.config.forcePathStyle) {
        return `${endpoint}/${bucket}`;
      }
      const endpointHost = endpoint.replace(/^https?:\/\//, '');
      const protocolMatch = endpoint.match(/^(https?):\/\//);
      const protocol = protocolMatch
        ? protocolMatch[1]
        : this.config.useSSL
          ? 'https'
          : 'http';
      return `${protocol}://${bucket}.${endpointHost}`;
    }

    return null;
  }
}
