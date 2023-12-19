// TODO: this was lifted from ganache, MM probably doesn't need Ganache's version
// of the crypto polyfill and it can probably just use `crypto-browserify` as a
// fallback.

interface ScryptCallback {
  (err: Error): void;
  (err: null, derivedKey: Uint8Array): void;
}

// @ts-ignore
import { createCipheriv, createDecipheriv } from 'browserify-aes';
import { scrypt as _scrypt } from 'scrypt-js';
const scrypt = (
  password: string,
  salt: string,
  keylen: number,
  options: { N: number; r: number; p: number },
  callback: ScryptCallback,
) => {
  _scrypt(
    new TextEncoder().encode(password),
    new TextEncoder().encode(salt),
    options.N,
    options.r,
    options.p,
    keylen,
  )
    .then((result) => {
      callback(null, result);
    })
    .catch((e: Error) => callback(e));
};

import {
  createHmac,
  createHash,
  pseudoRandomBytes,
  randomBytes,
  // @ts-ignore
} from 'crypto-browserify';

export default {
  scrypt,
  createHmac,
  createHash,
  pseudoRandomBytes,
  randomBytes,
  createCipheriv,
  createDecipheriv,
};

export {
  scrypt,
  createHmac,
  createHash,
  pseudoRandomBytes,
  randomBytes,
  createCipheriv,
  createDecipheriv,
};
