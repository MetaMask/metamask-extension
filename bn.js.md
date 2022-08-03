# Investigations of bn.js versions in MetaMeask Extension.

## Major Versions Summary

    1. 1
    2. 2
    3. 4
    4. 5

## Versions we can combine
1. 1.0.0
2. 2.0.4
3. 4.0.0
4. 4.1.1
5. 4.11.9
6. 4.4.0
7. 5.1.3
8. 5.2.0

We need at least these 8 versions in the extension, we also need to resolve other versions with minor versions to them. For instance we can combine all 4.11.X to 4.11.9

## Versions in the extension and what depended on them

1. ^1.0.0
   1. asn1.js@1.0.3: (optional dependency, see 3.2)
2. 2.0.4
   1. zcash-bitcore-lib@~0.13.20-rc3
3. ^4.0.0
   1. "@trezor/utxo-lib@1.0.0-beta.10"
   2. asn1.js@^4.0.0, asn1.js@^5.0.0, asn1.js@^5.0.1 (see 1.1)
   3. eth-eip712-util-browser@^0.0.3
   4. miller-rabin@^4.0.0
4. ^4.1.0
   1. browserify-rsa@^4.0.0
   2. create-ecdh@^4.0.0
   3. diffie-hellman@^5.0.0
   4. public-encrypt@^4.0.0
5. ^4.1.1
   1. browserify-sign@^4.0.0
6. ^4.11.0
   1. ethereumjs-util@^5.0.0, ethereumjs-util@^5.1.1, ethereumjs-util@^5.1.2, ethereumjs-util@^5.1.5, ethereumjs-util@^5.2.0, ethereumjs-util@^6.0.0, ethereumjs-util@^6.2.1
7. ^4.11.6
   1. "@types/bn.js@^4.11.3" (see 12.1)
   2. eth-lib@0.2.8
   3. ethjs-abi@0.2.0, ethjs-abi@0.2.1
   4. ethjs-format@0.2.2, ethjs-format@0.2.7
   5. ethjs-unit@0.1.6, ethjs-unit@^0.1.6
   6. ethjs@^0.3.0, ethjs@^0.3.6, ethjs@^0.4.0
   7. number-to-bn@1.7.0
8. ^4.11.7
   1. This is the version in resolutions block...resolves to 4.12.0
9. ^4.11.8
   1. libp2p-crypto@^0.16.0, libp2p-crypto@~0.16.0, libp2p-crypto@~0.16.1
   2. ethereumjs-abi@0.6.8, ethereumjs-abi@^0.6.4, ethereumjs-abi@^0.6.8
   3. "ethereumjs-abi@git+https://github.com/ethereumjs/ethereumjs-abi.git"
   4. secp256k1@^3.0.1, secp256k1@^3.6.1, secp256k1@^3.6.2:
   5. tiny-secp256k1@^1.1.0, tiny-secp256k1@^1.1.1, tiny-secp256k1@^1.1.6
10. ^4.11.9
    1. "@ethersproject/signing-key@5.5.0", "@ethersproject/signing-key@^5.5.0"
    2. elliptic@6.5.3, elliptic@6.5.4, elliptic@=3.0.3, elliptic@^6.0.0, elliptic@^6.4.0, elliptic@^6.4.1, elliptic@^6.5.2, elliptic@^6.5.4
    3. web3-utils@1.5.3
    4. "@ethersproject/bignumber@5.5.0", "@ethersproject/bignumber@^5.5.0"
11. ^4.4.0
    1. ethers@^4.0.20, ethers@^4.0.28
12. ^5.1.0
    1. "@types/bn.js@^5.1.0" (see 7.1)
13. ^5.1.1
    1. ripple-keypairs@^1.0.3
14. ^5.1.2
    1. ethereumjs-util@^7.0.10, ethereumjs-util@^7.0.2, ethereumjs-util@^7.0.7, ethereumjs-util@^7.0.8, ethereumjs-util@^7.0.9, ethereumjs-util@^7.1.0
    2.
15. ^5.1.3
    1. "@truffle/codec@^0.11.18", "@truffle/codec@^0.11.19"
    2. "@truffle/decoder@^5.1.0"
16. ^5.2.0

    1. eth-lattice-keyring@^0.7.3
    2. rlp@^2.0.0, rlp@^2.2.3, rlp@^2.2.4, rlp@^2.2.6

    All version resolved t0 4.12.0

## Direct Dependencies

1. "eth-lattice-keyring": "^0.7.3"
2. "@truffle/codec": "^0.11.18"
3. "@truffle/decoder": "^5.1.0"
4. "ethereumjs-util": "^7.0.10"
5. "ethers": "^5.0.8"
6. "ethereumjs-abi": "^0.6.4"
7. "ethjs": "^0.4.0"