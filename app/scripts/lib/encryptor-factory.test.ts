import * as browserPassworder from '@metamask/browser-passworder';
import { encryptorFactory } from './encryptor-factory';

jest.mock('@metamask/browser-passworder');

const mockIterations = 100;
const mockPassword = 'password';
const mockSalt = 'salt';
const mockData = 'data';

describe('encryptorFactory', () => {
  afterEach(async () => {
    jest.resetAllMocks();
  });

  const mockBrowserPassworder = browserPassworder as jest.Mocked<
    typeof browserPassworder
  >;

  it('should return an object with browser passworder methods', () => {
    const encryptor = encryptorFactory(mockIterations);

    [
      'encrypt',
      'encryptWithDetail',
      'encryptWithKey',
      'decrypt',
      'decryptWithDetail',
      'decryptWithKey',
      'keyFromPassword',
      'importKey',
      'exportKey',
      'generateSalt',
      'isVaultUpdated',
    ].forEach((method) => {
      expect(encryptor).toHaveProperty(method);
    });
  });

  describe('encrypt', () => {
    it('should call browser-passworder.encrypt with the given password, data, and iterations', async () => {
      const encryptor = encryptorFactory(mockIterations);

      await encryptor.encrypt(mockPassword, mockData);

      expect(mockBrowserPassworder.encrypt).toHaveBeenCalledWith(
        mockPassword,
        mockData,
        undefined,
        undefined,
        {
          algorithm: 'PBKDF2',
          params: {
            iterations: mockIterations,
          },
        },
      );
    });

    it('should return the result of browser-passworder.encrypt', async () => {
      const encryptor = encryptorFactory(mockIterations);
      const mockResult = 'result';
      mockBrowserPassworder.encrypt.mockResolvedValue(mockResult);

      expect(await encryptor.encrypt(mockPassword, mockData)).toBe(mockResult);
    });
  });

  describe('encryptWithDetail', () => {
    it('should call browser-passworder.encryptWithDetail with the given password, object, and iterations', async () => {
      const encryptor = encryptorFactory(mockIterations);

      await encryptor.encryptWithDetail(mockPassword, { foo: 'bar' }, 'salt');

      expect(mockBrowserPassworder.encryptWithDetail).toHaveBeenCalledWith(
        mockPassword,
        { foo: 'bar' },
        'salt',
        {
          algorithm: 'PBKDF2',
          params: {
            iterations: mockIterations,
          },
        },
      );
    });

    it('should return the result of browser-passworder.encryptWithDetail', async () => {
      const encryptor = encryptorFactory(mockIterations);
      const mockResult = {
        vault: 'vault',
        exportedKeyString: 'salt',
      };
      mockBrowserPassworder.encryptWithDetail.mockResolvedValue(mockResult);

      expect(
        await encryptor.encryptWithDetail(mockPassword, { foo: 'bar' }, 'salt'),
      ).toBe(mockResult);
    });
  });

  describe('decrypt', () => {
    it('should call browser-passworder.decrypt with the given password, data, and iterations', async () => {
      const encryptor = encryptorFactory(mockIterations);

      await encryptor.decrypt(mockPassword, mockData);

      expect(mockBrowserPassworder.decrypt).toHaveBeenCalledWith(
        mockPassword,
        mockData,
      );
    });

    it('should return the result of browser-passworder.decrypt', async () => {
      const encryptor = encryptorFactory(mockIterations);
      const mockResult = 'result';
      mockBrowserPassworder.decrypt.mockResolvedValue(mockResult);

      expect(await encryptor.decrypt(mockPassword, mockData)).toBe(mockResult);
    });
  });

  describe('decryptWithDetail', () => {
    it('should call browser-passworder.decryptWithDetail with the given password and object', async () => {
      const encryptor = encryptorFactory(mockIterations);

      await encryptor.decryptWithDetail(mockPassword, mockData);

      expect(mockBrowserPassworder.decryptWithDetail).toHaveBeenCalledWith(
        mockPassword,
        mockData,
      );
    });

    it('should return the result of browser-passworder.decryptWithDetail', async () => {
      const encryptor = encryptorFactory(mockIterations);
      const mockResult = {
        exportedKeyString: 'key',
        vault: 'data',
        salt: 'salt',
      };
      mockBrowserPassworder.decryptWithDetail.mockResolvedValue(mockResult);

      expect(await encryptor.decryptWithDetail(mockPassword, mockData)).toBe(
        mockResult,
      );
    });
  });

  describe('keyFromPassword', () => {
    it('should call browser-passworder.keyFromPassword with the given parameters', async () => {
      const encryptor = encryptorFactory(mockIterations);

      const keyDerivationOpts = {
        algorithm: 'PBKDF2' as const,
        params: {
          iterations: 1,
        },
      };

      const mockResult = {
        key: 'key',
        derivationOptions: keyDerivationOpts,
      };

      // @ts-expect-error The key type is a mock type and not valid.
      mockBrowserPassworder.keyFromPassword.mockResolvedValue(mockResult);

      expect(
        await encryptor.keyFromPassword(
          mockPassword,
          mockSalt,
          true,
          keyDerivationOpts,
        ),
      ).toBe(mockResult);

      expect(mockBrowserPassworder.keyFromPassword).toHaveBeenCalledWith(
        mockPassword,
        mockSalt,
        true,
        {
          algorithm: 'PBKDF2',
          params: {
            iterations: 1,
          },
        },
      );
    });

    it('should call browser-passworder.keyFromPassword with overriden opts', async () => {
      const encryptor = encryptorFactory(mockIterations);

      const mockResult = {
        key: 'key',
        derivationOptions: {
          algorithm: 'PBKDF2',
          params: {
            iterations: mockIterations,
          },
        },
      };

      // @ts-expect-error The key type is a mock type and not valid.
      mockBrowserPassworder.keyFromPassword.mockResolvedValue(mockResult);

      expect(
        await encryptor.keyFromPassword(
          mockPassword,
          mockSalt,
          true,
          undefined,
        ),
      ).toBe(mockResult);

      expect(mockBrowserPassworder.keyFromPassword).toHaveBeenCalledWith(
        mockPassword,
        mockSalt,
        true,
        {
          algorithm: 'PBKDF2',
          params: {
            iterations: mockIterations,
          },
        },
      );
    });
  });

  describe('isVaultUpdated', () => {
    it('should call browser-passworder.isVaultUpdated with the given vault and iterations', () => {
      const encryptor = encryptorFactory(mockIterations);
      const mockVault = 'vault';

      encryptor.isVaultUpdated(mockVault);

      expect(mockBrowserPassworder.isVaultUpdated).toHaveBeenCalledWith(
        mockVault,
        {
          algorithm: 'PBKDF2',
          params: {
            iterations: mockIterations,
          },
        },
      );
    });

    it('should return the result of browser-passworder.isVaultUpdated', () => {
      const encryptor = encryptorFactory(mockIterations);
      const mockResult = false;
      const mockVault = 'vault';
      mockBrowserPassworder.isVaultUpdated.mockReturnValue(mockResult);

      expect(encryptor.isVaultUpdated(mockVault)).toBe(mockResult);
    });
  });
});
