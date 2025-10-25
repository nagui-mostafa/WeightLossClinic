import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private readonly hashingOptions: argon2.Options & { raw?: false } = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 4,
    parallelism: 2,
  };

  hashPassword(plaintext: string): Promise<string> {
    return argon2.hash(plaintext, this.hashingOptions);
  }

  verifyPassword(hash: string, plaintext: string): Promise<boolean> {
    return argon2.verify(hash, plaintext, this.hashingOptions);
  }
}
