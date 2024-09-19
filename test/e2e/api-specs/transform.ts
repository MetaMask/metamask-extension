import {
  ExampleObject,
  ExamplePairingObject,
  MethodObject,
  OpenrpcDocument,
} from '@open-rpc/meta-schema';

const transformOpenRPCDocument = (
  openrpcDocument: OpenrpcDocument,
  chainId: number,
  account: string,
): [OpenrpcDocument, string[], string[]] => {
  // transform the document here

  const transaction =
    openrpcDocument.components?.schemas?.TransactionInfo?.allOf?.[0];

  if (transaction) {
    delete transaction.unevaluatedProperties;
  }

  const chainIdMethod = openrpcDocument.methods.find(
    (m) => (m as MethodObject).name === 'eth_chainId',
  );
  (chainIdMethod as MethodObject).examples = [
    {
      name: 'chainIdExample',
      description: 'Example of a chainId request',
      params: [],
      result: {
        name: 'chainIdResult',
        value: `0x${chainId.toString(16)}`,
      },
    },
  ];

  const getBalanceMethod = openrpcDocument.methods.find(
    (m) => (m as MethodObject).name === 'eth_getBalance',
  );

  (getBalanceMethod as MethodObject).examples = [
    {
      name: 'getBalanceExample',
      description: 'Example of a getBalance request',
      params: [
        {
          name: 'address',
          value: account,
        },
        {
          name: 'tag',
          value: 'latest',
        },
      ],
      result: {
        name: 'getBalanceResult',
        value: '0x1a8819e0c9bab700', // can we get this from a variable too
      },
    },
  ];

  const blockNumber = openrpcDocument.methods.find(
    (m) => (m as MethodObject).name === 'eth_blockNumber',
  );

  (blockNumber as MethodObject).examples = [
    {
      name: 'blockNumberExample',
      description: 'Example of a blockNumber request',
      params: [],
      result: {
        name: 'blockNumberResult',
        value: '0x1',
      },
    },
  ];

  const personalSign = openrpcDocument.methods.find(
    (m) => (m as MethodObject).name === 'personal_sign',
  );

  (personalSign as MethodObject).examples = [
    {
      name: 'personalSignExample',
      description: 'Example of a personalSign request',
      params: [
        {
          name: 'data',
          value: '0xdeadbeef',
        },
        {
          name: 'address',
          value: account,
        },
      ],
      result: {
        name: 'personalSignResult',
        value: '0x1a8819e0c9bab700',
      },
    },
  ];

  const switchEthereumChain = openrpcDocument.methods.find(
    (m) => (m as MethodObject).name === 'wallet_switchEthereumChain',
  );
  (switchEthereumChain as MethodObject).examples = [
    {
      name: 'wallet_switchEthereumChain',
      description: 'Example of a wallet_switchEthereumChain request to sepolia',
      params: [
        {
          name: 'SwitchEthereumChainParameter',
          value: {
            chainId: '0xaa36a7',
          },
        },
      ],
      result: {
        name: 'wallet_switchEthereumChain',
        value: null,
      },
    },
  ];

  const getProof = openrpcDocument.methods.find(
    (m) => (m as MethodObject).name === 'eth_getProof',
  );

  // delete invalid example until its fixed here: https://github.com/ethereum/execution-apis/pull/588
  (
    ((getProof as MethodObject).examples[0] as ExamplePairingObject)
      ?.params[1] as ExampleObject
  ).value.pop();

  const signTypedData4 = openrpcDocument.methods.find(
    (m) => (m as MethodObject).name === 'eth_signTypedData_v4',
  );

  const signTypedData4Example = (signTypedData4 as MethodObject)
    .examples?.[0] as ExamplePairingObject;

  // just update address for signTypedData
  (signTypedData4Example.params[0] as ExampleObject).value = account;

  // update chainId for signTypedData
  (signTypedData4Example.params[1] as ExampleObject).value.domain.chainId =
    chainId;

  // net_version missing from execution-apis. see here: https://github.com/ethereum/execution-apis/issues/540
  const netVersion: MethodObject = {
    name: 'net_version',
    summary: 'Returns the current network ID.',
    params: [],
    result: {
      description: 'Returns the current network ID.',
      name: 'net_version',
      schema: {
        type: 'string',
      },
    },
    description: 'Returns the current network ID.',
    examples: [
      {
        name: 'net_version',
        description: 'Example of a net_version request',
        params: [],
        result: {
          name: 'net_version',
          description: 'The current network ID',
          value: '0x1',
        },
      },
    ],
  };
  // add net_version
  (openrpcDocument.methods as MethodObject[]).push(
    netVersion as unknown as MethodObject,
  );

  const getEncryptionPublicKey = openrpcDocument.methods.find(
    (m) => (m as MethodObject).name === 'eth_getEncryptionPublicKey',
  );

  (getEncryptionPublicKey as MethodObject).examples = [
    {
      name: 'getEncryptionPublicKeyExample',
      description: 'Example of a getEncryptionPublicKey request',
      params: [
        {
          name: 'address',
          value: account,
        },
      ],
      result: {
        name: 'getEncryptionPublicKeyResult',
        value: '0x1a8819e0c9bab700',
      },
    },
  ];

  const getTransactionCount = openrpcDocument.methods.find(
    (m) => (m as MethodObject).name === 'eth_getTransactionCount',
  );
  (getTransactionCount as MethodObject).examples = [
    {
      name: 'getTransactionCountExampleEarliest',
      description: 'Example of a pending getTransactionCount request',
      params: [
        {
          name: 'address',
          value: account,
        },
        {
          name: 'tag',
          value: 'earliest',
        },
      ],
      result: {
        name: 'getTransactionCountResult',
        value: '0x0',
      },
    },
    {
      name: 'getTransactionCountExampleFinalized',
      description: 'Example of a pending getTransactionCount request',
      params: [
        {
          name: 'address',
          value: account,
        },
        {
          name: 'tag',
          value: 'finalized',
        },
      ],
      result: {
        name: 'getTransactionCountResult',
        value: '0x0',
      },
    },
    {
      name: 'getTransactionCountExampleSafe',
      description: 'Example of a pending getTransactionCount request',
      params: [
        {
          name: 'address',
          value: account,
        },
        {
          name: 'tag',
          value: 'safe',
        },
      ],
      result: {
        name: 'getTransactionCountResult',
        value: '0x0',
      },
    },
    {
      name: 'getTransactionCountExample',
      description: 'Example of a getTransactionCount request',
      params: [
        {
          name: 'address',
          value: account,
        },
        {
          name: 'tag',
          value: 'latest',
        },
      ],
      result: {
        name: 'getTransactionCountResult',
        value: '0x0',
      },
    },
    // returns a number right now. see here: https://github.com/MetaMask/metamask-extension/pull/14822
    // {
    //   name: 'getTransactionCountExamplePending',
    //   description: 'Example of a pending getTransactionCount request',
    //   params: [
    //     {
    //       name: 'address',
    //       value: account,
    //     },
    //     {
    //       name: 'tag',
    //       value: 'pending',
    //     },
    //   ],
    //   result: {
    //     name: 'getTransactionCountResult',
    //     value: '0x0',
    //   },
    // },
  ];
  // TODO: move these to a "Confirmation" tag in api-specs
  const methodsWithConfirmations = [
    'wallet_requestPermissions',
    'eth_requestAccounts',
    'wallet_watchAsset',
    'personal_sign', // requires permissions for eth_accounts
    'wallet_addEthereumChain',
    'eth_signTypedData_v4', // requires permissions for eth_accounts
    'wallet_switchEthereumChain',

    // commented out because its not returning 4001 error.
    // see here https://github.com/MetaMask/metamask-extension/issues/24227
    // 'eth_getEncryptionPublicKey', // requires permissions for eth_accounts
  ];
  const filteredMethods = openrpcDocument.methods
    .filter((_m: unknown) => {
      const m = _m as MethodObject;
      return (
        m.name.includes('snap') ||
        m.name.includes('Snap') ||
        m.name.toLowerCase().includes('account') ||
        m.name.includes('crypt') ||
        m.name.includes('blob') ||
        m.name.includes('sendTransaction') ||
        m.name.startsWith('wallet_scanQRCode') ||
        methodsWithConfirmations.includes(m.name) ||
        // filters are currently 0 prefixed for odd length on
        // extension which doesn't pass spec
        // see here: https://github.com/MetaMask/eth-json-rpc-filters/issues/152
        m.name.includes('filter') ||
        m.name.includes('Filter')
      );
    })
    .map((m) => (m as MethodObject).name);
  return [openrpcDocument, filteredMethods, methodsWithConfirmations];
};

export default transformOpenRPCDocument;
