import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class JsonBodyParserPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }
    if (!value || typeof value !== 'object') {
      return value;
    }

    const record = value as Record<string, unknown>;
    const payload = record.payload;
    if (typeof payload !== 'string') {
      return value;
    }

    const cloned = { ...record };
    delete cloned.payload;

    try {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed === 'object') {
        return { ...cloned, ...(parsed as Record<string, unknown>) };
      }
      return parsed;
    } catch (error) {
      throw new BadRequestException('Invalid JSON payload');
    }
  }
}
