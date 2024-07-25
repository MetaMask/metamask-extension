export const MOCK_PERMIT = {
  contents: { value: 'Hello, Bob!', type: 'string' },
  from: {
    value: {
      name: { value: 'Cow', type: 'string' },
      wallets: {
        value: [
          {
            value: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            type: 'address',
          },
          {
            value: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
            type: 'address',
          },
        ],
        type: 'address[]',
      },
    },
    type: 'Person',
  },
  to: {
    value: [
      {
        value: {
          name: { value: 'Bob', type: 'string' },
          wallets: {
            value: [
              {
                value: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                type: 'address',
              },
              {
                value: '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                type: 'address',
              },
              {
                value: '0xB0B0b0b0b0b0B000000000000000000000000000',
                type: 'address',
              },
            ],
            type: 'address[]',
          },
        },
        type: 'Person',
      },
    ],
    type: 'Person[]',
  },
  attachment: { value: '0x', type: 'bytes' },
};
