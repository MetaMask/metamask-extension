import log from 'loglevel'
import utf8 from 'utf8'
import crypto from 'crypto'
import scryptsy from '@web3-js/scrypt-shim'
import ethUtil from 'ethereumjs-util'


//
// ethereumjs-wallet stub
//

const evpKdfDefaults = {
  count: 1,
  keysize: 16,
  ivsize: 16,
  digest: 'md5',
}
class Wallet {
  constructor (privateKey) {
    if (privateKey && !ethUtil.isValidPrivate(privateKey)) {
      throw new Error('Private key does not satisfy the curve requirements (ie. it is invalid)')
    }
    this.privateKey = privateKey
  }
  getAddressString () {
    return ethUtil.bufferToHex(this.getAddress())
  }
}

const accountImporter = {

  importAccount (strategy, args) {
    try {
      const importer = this.strategies[strategy]
      const privateKeyHex = importer.apply(null, args)
      return Promise.resolve(privateKeyHex)
    } catch (e) {
      return Promise.reject(e)
    }
  },

  strategies: {
    'Private Key': (privateKey) => {
      if (!privateKey) {
        throw new Error('Cannot import an empty key.')
      }

      const prefixed = ethUtil.addHexPrefix(privateKey)
      const buffer = ethUtil.toBuffer(prefixed)

      if (!ethUtil.isValidPrivate(buffer)) {
        throw new Error('Cannot import invalid private key.')
      }

      const stripped = ethUtil.stripHexPrefix(prefixed)
      return stripped
    },
    'JSON File': (input, password) => {
      let wallet
      try {
        wallet = fromEtherWallet(input, password)
      } catch (e) {
        log.debug('Attempt to import as EtherWallet format failed, trying V3')
        wallet = fromV3(input, password, true)
      }

      return walletToPrivateKey(wallet)
    },
  },

}

function walletToPrivateKey (wallet) {
  const privateKeyBuffer = wallet.getPrivateKey()
  return ethUtil.bufferToHex(privateKeyBuffer)
}

export default accountImporter


//
// from ethereumjs-wallet
//

function fromV3 (input, password, nonStrict = false) {
  const json = typeof input === 'object' ? input : JSON.parse(nonStrict ? input.toLowerCase() : input)
  if (json.version !== 3) {
    throw new Error('Not a V3 wallet')
  }
  let derivedKey, kdfparams
  if (json.crypto.kdf === 'scrypt') {
    kdfparams = json.crypto.kdfparams
    // FIXME: support progress reporting callback
    derivedKey = scryptsy(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen)
  } else if (json.crypto.kdf === 'pbkdf2') {
    kdfparams = json.crypto.kdfparams
    if (kdfparams.prf !== 'hmac-sha256') {
      throw new Error('Unsupported parameters to PBKDF2')
    }
    derivedKey = crypto.pbkdf2Sync(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.c, kdfparams.dklen, 'sha256')
  } else {
    throw new Error('Unsupported key derivation scheme')
  }
  const ciphertext = Buffer.from(json.crypto.ciphertext, 'hex')
  const mac = ethUtil.keccak256(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
  if (mac.toString('hex') !== json.crypto.mac) {
    throw new Error('Key derivation failed - possibly wrong passphrase')
  }
  const decipher = crypto.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 16), Buffer.from(json.crypto.cipherparams.iv, 'hex'))
  const seed = runCipherBuffer(decipher, ciphertext)
  return new Wallet(seed)
}

function fromEtherWallet (input, password) {
  const json = typeof input === 'object' ? input : JSON.parse(input)
  let privateKey
  if (!json.locked) {
    if (json.private.length !== 64) {
      throw new Error('Invalid private key length')
    }
    privateKey = Buffer.from(json.private, 'hex')
  } else {
    if (typeof password !== 'string') {
      throw new Error('Password required')
    }
    if (password.length < 7) {
      throw new Error('Password must be at least 7 characters')
    }
    // the "encrypted" version has the low 4 bytes
    // of the hash of the address appended
    const hash = json.encrypted ? json.private.slice(0, 128) : json.private
    // decode openssl ciphertext + salt encoding
    const cipher = decodeCryptojsSalt(hash)
    if (!cipher.salt) {
      throw new Error('Unsupported EtherWallet key format')
    }
    // derive key/iv using OpenSSL EVP as implemented in CryptoJS
    const evp = evpKdf(Buffer.from(password), cipher.salt, { keysize: 32, ivsize: 16 })
    const decipher = crypto.createDecipheriv('aes-256-cbc', evp.key, evp.iv)
    privateKey = runCipherBuffer(decipher, Buffer.from(cipher.ciphertext))
    // NOTE: yes, they've run it through UTF8
    privateKey = Buffer.from(utf8.decode(privateKey.toString()), 'hex')
  }
  const wallet = new Wallet(privateKey)
  if (wallet.getAddressString() !== json.address) {
    throw new Error('Invalid private key or address')
  }
  return wallet
}

// http://stackoverflow.com/questions/25288311/cryptojs-aes-pattern-always-ends-with
function decodeCryptojsSalt (input) {
  const ciphertext = Buffer.from(input, 'base64')
  if (ciphertext.slice(0, 8).toString() === 'Salted__') {
    return {
      salt: ciphertext.slice(8, 16),
      ciphertext: ciphertext.slice(16),
    }
  }
  return { ciphertext }
}

function evpKdf (data, salt, opts) {
  const params = mergeEvpKdfOptsWithDefaults(opts)
  // A single EVP iteration, returns `D_i`, where block equlas to `D_(i-1)`
  function iter (block) {
    let hash = crypto.createHash(params.digest)
    hash.update(block)
    hash.update(data)
    hash.update(salt)
    block = hash.digest()
    for (let i = 1, len = params.count; i < len; i++) {
      hash = crypto.createHash(params.digest)
      hash.update(block)
      block = hash.digest()
    }
    return block
  }
  const ret = []
  let i = 0
  while (Buffer.concat(ret).length < params.keysize + params.ivsize) {
    ret[i] = iter(i === 0 ? Buffer.alloc(0) : ret[i - 1])
    i++
  }
  const tmp = Buffer.concat(ret)
  return {
    key: tmp.slice(0, params.keysize),
    iv: tmp.slice(params.keysize, params.keysize + params.ivsize),
  }
}

function mergeEvpKdfOptsWithDefaults (opts) {
  if (!opts) {
    return evpKdfDefaults
  }
  return {
    count: opts.count || evpKdfDefaults.count,
    keysize: opts.keysize || evpKdfDefaults.keysize,
    ivsize: opts.ivsize || evpKdfDefaults.ivsize,
    digest: opts.digest || evpKdfDefaults.digest,
  }
}

function runCipherBuffer (cipher, data) {
  return Buffer.concat([cipher.update(data), cipher.final()])
}
