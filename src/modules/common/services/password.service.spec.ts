import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies passwords', async () => {
    const password = 'S3cureP@ssword!';
    const hash = await service.hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    await expect(service.verifyPassword(hash, password)).resolves.toBe(true);
    await expect(service.verifyPassword(hash, 'wrong')).resolves.toBe(false);
  });
});
