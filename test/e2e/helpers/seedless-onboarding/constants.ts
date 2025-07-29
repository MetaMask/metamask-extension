export const PasswordChangeItemId = 'PW_BACKUP';

export const AuthServer = {
  // Request JWT Token from Auth Server in exchange for OAuth2 Authorization Code
  RequestToken:
    'https://auth-service.dev-api.cx.metamask.io/api/v1/oauth/token',
  // Revoke current JWT Token from Auth Server
  RevokeToken:
    'https://auth-service.dev-api.cx.metamask.io/api/v1/oauth/revoke',
};

export const SSSBaseUrlRgx =
  /https:\/\/node-[1-5]\.dev-node\.web3auth\.io\/sss\/jrpc/u;

export const MetadataService = {
  // Get the encrypted account data from the metadata service
  Get: 'https://node-1.dev-node.web3auth.io/metadata/enc_account_data/get',
  // Set the encrypted account data to the metadata service
  Set: 'https://node-1.dev-node.web3auth.io/metadata/enc_account_data/set',
  // Acquire the lock for the metadata service
  AcquireLock: 'https://node-1.dev-node.web3auth.io/metadata/acquireLock',
  // Release the lock for the metadata service
  ReleaseLock: 'https://node-1.dev-node.web3auth.io/metadata/releaseLock',
  // Batch set the encrypted account data to the metadata service
  BatchSet:
    'https://node-1.dev-node.web3auth.io/metadata/enc_account_data/batch_set',
};

// mock key pairs for the SSS nodes
export const SSSNodeKeyPairs: {
  [nodeIndex: number]: {
    pubKey: string;
    privKey: string;
  };
} = {
  1: {
    pubKey:
      '04b6a0af1372430d21536c9317b3f2e8ecf053236ae9ca8a0f0ab03dd07d13dc634f4c07194ec80c8aa1fdc0c8dfcf719a872155166bfc1e2ed27c295d4dfccd98',
    privKey: 'c376367061b28d03b569e60fb6feed5246eb20060d1464f7a9d170993ba84544',
  },
  2: {
    pubKey:
      '047ceccc9ad0415111973bf21814273c4aa4431673e9eb6d35abbf903084e8d2096d9f34c50f5c627f152fa1eef1d3f83851ef00f01e13228ba684f17e268b20fa',
    privKey: '1340e7abecdefa4c424afbd97d3ec410350cc18b277c5caf2edbd0c388411a0d',
  },
  3: {
    pubKey:
      '046d3727f50b088b6f465d611af6bcbb57d04bd054b4cea0f8b4aade5a67e3c7f0759c9a1916e0d2ef3c9639e6bd97e510ee5a40cda2339e5df0cb9a2fbf9e7144',
    privKey: '6d466e55a5a0e9b8f00a3e676f85ccca1db0aa1dbde5c570aa68d3aaa55eded1',
  },
  4: {
    pubKey:
      '047eac8164381bc1a02f2ddc01b0fd4b20eb1a24b908a6a7ad6d31b215f6f0789022475d323664ace72c6db05c62d96ad5d57b0283034f6aa12bfa57e1672e33cb',
    privKey: '10ff6103ff2627ba0b27486683ed421250d27afb245c983ab690ccebb9b7c87a',
  },
  5: {
    pubKey:
      '0439bd322c77c582ae9252ae32fd405da7995fa2c3a7319029771bac15100f2452a3cbf1c4086d12b1691bb1c78dec77342349447be8862165fa0a51bd30b7e427',
    privKey: '5233e5c1c7f3aff542bc2a3f7fcf63d2cbe352365f553e36880bd83b3ea6c861',
  },
};
