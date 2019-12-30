module.exports = [
  {
    payable: true,
    stateMutability: 'payable',
    type: 'fallback',
  },
  {
    constant: true,
    inputs: [
      {
        name: 'user',
        type: 'address',
      },
      {
        name: 'token',
        type: 'address',
      },
    ],
    name: 'tokenBalance',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: 'users',
        type: 'address[]',
      },
      {
        name: 'tokens',
        type: 'address[]',
      },
    ],
    name: 'balances',
    outputs: [
      {
        name: '',
        type: 'uint256[]',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]
