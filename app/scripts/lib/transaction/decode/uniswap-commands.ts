export const UNISWAP_ROUTER_COMMANDS = {
  '0': {
    name: 'V3_SWAP_EXACT_IN',
    params: [
      {
        type: 'address',
        description: 'The recipient of the output of the trade',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The amount of input tokens for the trade',
        name: 'amountIn',
      },
      {
        type: 'uint256',
        description: 'The minimum amount of output tokens the user wants',
        name: 'amountOutMin',
      },
      {
        type: 'bytes',
        description: 'The UniswapV3 encoded path to trade along',
        name: 'path',
      },
      {
        type: 'bool',
        description:
          'A flag for whether the input tokens should come from the msg.sender (through Permit2) or whether the funds are already in the UniversalRouter',
        name: 'payerIsUser',
      },
    ],
  },
  '1': {
    name: 'V3_SWAP_EXACT_OUT',
    params: [
      {
        type: 'address',
        description: 'The recipient of the output of the trade',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The amount of output tokens to receive',
        name: 'amountOut',
      },
      {
        type: 'uint256',
        description: 'The maximum number of input tokens that should be spent',
        name: 'amountInMax',
      },
      {
        type: 'bytes',
        description: 'The UniswapV3 encoded path to trade along',
        name: 'path',
      },
      {
        type: 'bool',
        description:
          'A flag for whether the input tokens should come from the msg.sender (through Permit2) or whether the funds are already in the UniversalRouter',
        name: 'payerIsUser',
      },
    ],
  },
  '2': {
    name: 'PERMIT2_TRANSFER_FROM',
    params: [
      {
        type: 'address',
        description: 'The token to fetch from Permit2',
        name: 'token',
      },
      {
        type: 'address',
        description: 'The recipient of the tokens fetched',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The amount of token to fetch',
        name: 'amount',
      },
    ],
  },
  '3': {
    name: 'PERMIT2_PERMIT_BATCH',
    params: [
      {
        type: 'bytes',
        description:
          'A PermitBatch struct outlining all of the Permit2 permits to execute.',
        name: 'batch',
      },
      {
        type: 'bytes',
        description: 'The signature to provide to Permit2',
        name: 'data',
      },
    ],
  },
  '4': {
    name: 'SWEEP',
    params: [
      {
        type: 'address',
        description: 'The ERC20 token to sweep (or Constants.ETH for ETH)',
        name: 'token',
      },
      {
        type: 'address',
        description: 'The recipient of the sweep',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The minimum required tokens to receive from the sweep',
        name: 'amountMin',
      },
    ],
  },
  '5': {
    name: 'TRANSFER',
    params: [
      {
        type: 'address',
        description: 'The ERC20 token to transfer (or Constants.ETH for ETH)',
        name: 'token',
      },
      {
        type: 'address',
        description: 'The recipient of the transfer',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The amount to transfer',
        name: 'value',
      },
    ],
  },
  '6': {
    name: 'PAY_PORTION',
    params: [
      {
        type: 'address',
        description: 'The ERC20 token to transfer (or Constants.ETH for ETH)',
        name: 'token',
      },
      {
        type: 'address',
        description: 'The recipient of the transfer',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description:
          'In basis points, the percentage of the contract’s balance to transfer',
        name: 'bips',
      },
    ],
  },
  '8': {
    name: 'V2_SWAP_EXACT_IN',
    params: [
      {
        type: 'address',
        description: 'The recipient of the output of the trade',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The amount of input tokens for the trade',
        name: 'amountIn',
      },
      {
        type: 'uint256',
        description: 'The minimum amount of output tokens the user wants',
        name: 'amountOutMin',
      },
      {
        type: 'address[]',
        description: 'The UniswapV2 token path to trade along',
        name: 'path',
      },
      {
        type: 'bool',
        description:
          'A flag for whether the input tokens should come from the msg.sender (through Permit2) or whether the funds are already in the UniversalRouter',
        name: 'payerIsUser',
      },
    ],
  },
  '9': {
    name: 'V2_SWAP_EXACT_OUT',
    params: [
      {
        type: 'address',
        description: 'The recipient of the output of the trade',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The amount of output tokens to receive',
        name: 'amountOut',
      },
      {
        type: 'uint256',
        description: 'The maximum number of input tokens that should be spent',
        name: 'amountInMax',
      },
      {
        type: 'address[]',
        description: 'The UniswapV2 token path to trade along',
        name: 'path',
      },
      {
        type: 'bool',
        description:
          'A flag for whether the input tokens should come from the msg.sender (through Permit2) or whether the funds are already in the UniversalRouter',
        name: 'payerIsUser',
      },
    ],
  },
  '10': {
    name: 'PERMIT2_PERMIT',
    params: [
      {
        type: 'bytes',
        description:
          'A PermitSingle struct outlining the Permit2 permit to execute',
        name: 'permitSingle',
      },
      {
        type: 'bytes',
        description: 'The signature to provide to Permit2',
        name: 'signature',
      },
    ],
  },
  '11': {
    name: 'WRAP_ETH',
    params: [
      {
        type: 'address',
        description: 'The recipient of the WETH',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The amount of ETH to wrap',
        name: 'amountMin',
      },
    ],
  },
  '12': {
    name: 'UNWRAP_WETH',
    params: [
      {
        type: 'address',
        description: 'The recipient of the ETH',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The minimum required ETH to receive from the unwrapping',
        name: 'amountMin',
      },
    ],
  },
  '13': {
    name: 'PERMIT2_TRANSFER_FROM_BATCH',
    params: [
      {
        type: 'bytes',
        description:
          'An array of AllowanceTransferDetails structs that each describe a Permit2 transfer to perform',
        name: 'batchDetails',
      },
    ],
  },
  '16': {
    name: 'SEAPORT',
    params: [
      {
        type: 'uint256',
        description: 'The ETH value to forward to the Seaport contract',
        name: 'value',
      },
      {
        type: 'bytes',
        description: 'The calldata to use to call the Seaport contract',
        name: 'data',
      },
    ],
  },
  '17': {
    name: 'LOOKS_RARE_721',
    params: [
      {
        type: 'uint256',
        description: 'The ETH value to forward to the LooksRare contract',
        name: 'value',
      },
      {
        type: 'bytes',
        description: 'The calldata to use to call the LooksRare contract',
        name: 'data',
      },
      {
        type: 'address',
        description: 'The recipient of the ERC721',
        name: 'recipient',
      },
      {
        type: 'address',
        description: 'The ERC721 token address',
        name: 'token',
      },
      {
        type: 'uint256',
        description: 'The ID of the ERC721',
        name: 'id',
      },
    ],
  },
  '18': {
    name: 'NFTX',
    params: [
      {
        type: 'uint256',
        description: 'The ETH value to forward to the NFTX contract',
        name: 'value',
      },
      {
        type: 'bytes',
        description: 'The calldata to use to call the NFTX contract',
        name: 'data',
      },
    ],
  },
  '19': {
    name: 'CRYPTOPUNKS',
    params: [
      {
        type: 'uint256',
        description: 'The PunkID to purchase',
        name: 'punkId',
      },
      {
        type: 'address',
        description: 'The recipient for the cryptopunk',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The ETH value to forward to the Cryptopunks contract',
        name: 'value',
      },
    ],
  },
  '20': {
    name: 'LOOKS_RARE_1155',
    params: [
      {
        type: 'uint256',
        description: 'The ETH value to forward to the LooksRare contract',
        name: 'value',
      },
      {
        type: 'bytes',
        description: 'The calldata to use to call the LooksRare contract',
        name: 'data',
      },
      {
        type: 'address',
        description: 'The recipient of the ERC1155',
        name: 'recipient',
      },
      {
        type: 'address',
        description: 'The ERC1155 token address',
        name: 'token',
      },
      {
        type: 'uint256',
        description: 'The ID of the ERC1155',
        name: 'id',
      },
      {
        type: 'uint256',
        description: 'The amount of the ERC1155 to transfer',
        name: 'amount',
      },
    ],
  },
  '21': {
    name: 'OWNER_CHECK_721',
    params: [
      {
        type: 'address',
        description: 'The required owner of the ERC721',
        name: 'owner',
      },
      {
        type: 'address',
        description: 'The ERC721 token address',
        name: 'token',
      },
      {
        type: 'uint256',
        description: 'The ID of the ERC721',
        name: 'id',
      },
    ],
  },
  '22': {
    name: 'OWNER_CHECK_1155',
    params: [
      {
        type: 'address',
        description: 'The required owner of the ERC1155',
        name: 'owner',
      },
      {
        type: 'address',
        description: 'The ERC721 token address',
        name: 'token',
      },
      {
        type: 'uint256',
        description: 'The ID of the ERC1155',
        name: 'id',
      },
      {
        type: 'uint256',
        description: 'The minimum required amount of the ERC1155',
        name: 'minBalance',
      },
    ],
  },
  '23': {
    name: 'SWEEP_ERC721',
    params: [
      {
        type: 'address',
        description: 'The ERC721 token address to transfer',
        name: 'token',
      },
      {
        type: 'address',
        description: 'The recipient of the transfer',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The token ID to transfer',
        name: 'id',
      },
    ],
  },
  '24': {
    name: 'X2Y2_721',
    params: [
      {
        type: 'uint256',
        description: 'The ETH value to forward to the X2Y2 contract',
        name: 'value',
      },
      {
        type: 'bytes',
        description: 'The calldata to use to call the X2Y2 contract',
        name: 'data',
      },
      {
        type: 'address',
        description: 'The recipient of the ERC721',
        name: 'recipient',
      },
      {
        type: 'address',
        description: 'The ERC721 token address',
        name: 'token',
      },
      {
        type: 'uint256',
        description: 'The ID of the ERC721',
        name: 'id',
      },
    ],
  },
  '25': {
    name: 'SUDOSWAP',
    params: [
      {
        type: 'uint256',
        description: 'The ETH value to forward to the Sudoswap contract',
        name: 'value',
      },
      {
        type: 'bytes',
        description: 'The calldata to use to call the Sudoswap contract',
        name: 'data',
      },
    ],
  },
  '26': {
    name: 'NFT20',
    params: [
      {
        type: 'uint256',
        description: 'The ETH value to forward to the NFT20 contract',
        name: 'value',
      },
      {
        type: 'bytes',
        description: 'The calldata to use to call the NFT20 contract',
        name: 'data',
      },
    ],
  },
  '27': {
    name: 'X2Y2_1155',
    params: [
      {
        type: 'uint256',
        description: 'The ETH value to forward to the X2Y2 contract',
        name: 'value',
      },
      {
        type: 'bytes',
        description: 'The calldata to use to call the X2Y2 contract',
        name: 'data',
      },
      {
        type: 'address',
        description: 'The recipient of the ERC1155',
        name: 'recipient',
      },
      {
        type: 'address',
        description: 'The ERC1155 token address',
        name: 'token',
      },
      {
        type: 'uint256',
        description: 'The ID of the ERC1155',
        name: 'id',
      },
      {
        type: 'uint256',
        description: 'The amount of the ERC1155 to transfer',
        name: 'amount',
      },
    ],
  },
  '28': {
    name: 'FOUNDATION',
    params: [
      {
        type: 'uint256',
        description: 'The ETH value to forward to the Foundation contract',
        name: 'value',
      },
      {
        type: 'bytes',
        description: 'The calldata to use to call the Foundation contract',
        name: 'data',
      },
      {
        type: 'address',
        description: 'The recipient of the ERC721',
        name: 'recipient',
      },
      {
        type: 'address',
        description: 'The ERC721 token address',
        name: 'token',
      },
      {
        type: 'uint256',
        description: 'The ID of the ERC721',
        name: 'id',
      },
    ],
  },
  '29': {
    name: 'SWEEP_ERC1155',
    params: [
      {
        type: 'address',
        description: 'The ERC1155 token address to sweep',
        name: 'token',
      },
      {
        type: 'address',
        description: 'The recipient of the sweep',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The token ID to sweep',
        name: 'id',
      },
      {
        type: 'uint256',
        description: 'The minimum required tokens to receive from the sweep',
        name: 'amount',
      },
    ],
  },
};
