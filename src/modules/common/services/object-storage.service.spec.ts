import { ConfigService } from '@nestjs/config';
import { ObjectStorageService } from './object-storage.service';
import { Configuration } from '../../config/configuration';

describe('ObjectStorageService', () => {
  const baseConfig: Configuration['objectStorage'] = {
    driver: 'minio',
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    bucket: 'weight-loss-media',
    accessKey: '',
    secretKey: '',
    forcePathStyle: true,
    useSSL: false,
    publicBaseUrl: undefined,
  };

  const createService = (
    overrides: Partial<Configuration['objectStorage']> = {},
  ) => {
    const config: Configuration['objectStorage'] = {
      ...baseConfig,
      ...overrides,
    };
    const mockConfigService = {
      get: jest.fn().mockReturnValue(config),
    } as unknown as ConfigService<Configuration, true>;
    return new ObjectStorageService(mockConfigService);
  };

  it('builds S3-style URLs when driver is s3', () => {
    const service = createService({
      driver: 's3',
      bucket: 'cdn-bucket',
      region: 'us-west-2',
    });
    const url = service.getPublicUrl('assets/hero.png');
    expect(url).toBe(
      'https://cdn-bucket.s3.us-west-2.amazonaws.com/assets/hero.png',
    );
  });

  it('builds MinIO path-style URLs when configured', () => {
    const service = createService({
      endpoint: 'http://127.0.0.1:9000',
      forcePathStyle: true,
    });
    const url = service.getPublicUrl('/images/hero.png', 'custom-bucket');
    expect(url).toBe('http://127.0.0.1:9000/custom-bucket/images/hero.png');
  });

  it('normalizes object keys', () => {
    const service = createService();
    expect(service.normalizeObjectKey('  /folder/file.png ')).toBe(
      'folder/file.png',
    );
    expect(service.normalizeObjectKey('')).toBeNull();
    expect(service.normalizeObjectKey(undefined)).toBeNull();
  });
});
