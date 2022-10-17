const mockHex = '0xabcdef0123456789';
const mockKey = Buffer.alloc(32);
let cacheVal;

const mockEncryptor = {
  async encrypt(_, dataObj) {
    cacheVal = dataObj;
    return mockHex;
  },

  async decrypt() {
    return cacheVal || {};
  },

  encryptWithDetail(_, dataObj) {
    cacheVal = dataObj;

    return Promise.resolve({ vault: mockHex, exportedKeyString: '' });
  },

  encryptWithKey(key, dataObj) {
    return this.encrypt(key, dataObj);
  },

  decryptWithKey(key, text) {
    return this.decrypt(key, text);
  },

  async keyFromPassword() {
    return mockKey;
  },

  generateSalt() {
    return 'WHADDASALT!';
  },

  getRandomValues() {
    return 'SOO RANDO!!!1';
  },
};

export default mockEncryptor;
