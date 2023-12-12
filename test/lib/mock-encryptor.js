export const MOCK_ENCRYPTION_KEY = JSON.stringify({
  alg: 'A256GCM',
  ext: true,
  k: 'wYmxkxOOFBDP6F6VuuYFcRt_Po-tSLFHCWVolsHs4VI',
  key_ops: ['encrypt', 'decrypt'],
  kty: 'oct',
});
export const MOCK_ENCRYPTION_SALT =
  'HQ5sfhsb8XAQRJtD+UqcImT7Ve4n3YMagrh05YTOsjk=';
export const MOCK_HARDCODED_KEY = 'key';
export const MOCK_HEX = '0xabcdef0123456789';
const MOCK_KEY = Buffer.alloc(32);

let cacheVal;

const mockEncryptor = {
  async encrypt(password, dataObj) {
    return JSON.stringify({
      ...(await this.encryptWithKey(password, dataObj)),
      salt: this.generateSalt(),
    });
  },

  async decrypt(_password, _text) {
    return cacheVal ?? {};
  },

  async encryptWithKey(_key, dataObj) {
    cacheVal = dataObj;
    return {
      data: MOCK_HEX,
      iv: 'anIv',
    };
  },

  async encryptWithDetail(key, dataObj) {
    return {
      vault: await this.encrypt(key, dataObj),
      exportedKeyString: MOCK_HARDCODED_KEY,
    };
  },

  async decryptWithDetail(key, text) {
    return {
      vault: await this.decrypt(key, text),
      salt: MOCK_ENCRYPTION_SALT,
      exportedKeyString: MOCK_ENCRYPTION_KEY,
    };
  },

  async decryptWithKey(key, text) {
    return this.decrypt(key, text);
  },

  async keyFromPassword(_password) {
    return MOCK_KEY;
  },

  async importKey(key) {
    if (key === '{}') {
      throw new TypeError(
        `Failed to execute 'importKey' on 'SubtleCrypto': The provided value is not of type '(ArrayBuffer or ArrayBufferView or JsonWebKey)'.`,
      );
    }
    return null;
  },

  async updateVault(_vault, _password) {
    return _vault;
  },

  isVaultUpdated(_vault) {
    return true;
  },

  generateSalt() {
    return MOCK_ENCRYPTION_SALT;
  },
};

export default mockEncryptor;
