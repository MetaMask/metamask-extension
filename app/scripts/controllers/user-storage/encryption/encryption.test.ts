import { createMockFullUserStorage } from '../../metamask-notifications/mocks/mock-notification-user-storage';
import encryption, { createSHA256Hash } from './encryption';

describe('encryption tests', () => {
  const PASSWORD = '123';
  const DATA1 = 'Hello World';
  const DATA2 = JSON.stringify({ foo: 'bar' });
  const DATA3 = JSON.stringify(createMockFullUserStorage());

  it('Should encrypt and decrypt data', () => {
    function actEncryptDecrypt(data: string) {
      const encryptedString = encryption.encryptString(data, PASSWORD);
      const decryptString = encryption.decryptString(encryptedString, PASSWORD);
      return decryptString;
    }

    expect(actEncryptDecrypt(DATA1)).toBe(DATA1);
    expect(actEncryptDecrypt(DATA2)).toBe(DATA2);
    expect(actEncryptDecrypt(DATA3)).toBe(DATA3);
  });

  it('Should decrypt some existing data', () => {
    const encryptedData = `{"v":"1","t":"scrypt","d":"WNEp1QXUZsxCfW9b27uzZ18CtsMvKP6+cqLq8NLAItXeYcFcUjtKprfvedHxf5JN9Q7pe50qnA==","o":{"N":131072,"r":8,"p":1,"dkLen":16},"saltLen":16}`;
    const result = encryption.decryptString(encryptedData, PASSWORD);
    expect(result).toBe(DATA1);
  });

  it('Should sha-256 hash a value and should be deterministic', () => {
    const DATA = 'Hello World';
    const EXPECTED_HASH =
      'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e';

    const hash1 = createSHA256Hash(DATA);
    expect(hash1).toBe(EXPECTED_HASH);

    // Hash should be deterministic (same output with same input)
    const hash2 = createSHA256Hash(DATA);
    expect(hash1).toBe(hash2);
  });
});
