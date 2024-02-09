const MOCK_TX_TYPE = {
  CANCEL: 'cancel',
  CONTRACT_INTERACTION: 'contractInteraction',
  DEPLOY_CONTRACT: 'contractDeployment',
  ETH_DECRYPT: 'eth_decrypt',
  ETH_GET_ENCRYPTION_PUBLIC_KEY: 'eth_getEncryptionPublicKey',
  INCOMING: 'incoming',
  PERSONAL_SIGN: 'personal_sign',
  RETRY: 'retry',
  SIGN: 'eth_sign',
  SIGN_TYPED_DATA: 'eth_signTypedData',
  SIMPLE_SEND: 'simpleSend',
  SMART: 'smart',
  SWAP: 'swap',
  SWAP_APPROVAL: 'swapApproval',
  TOKEN_METHOD_APPROVE: 'approve',
  TOKEN_METHOD_SAFE_TRANSFER_FROM: 'safetransferfrom',
  TOKEN_METHOD_TRANSFER: 'transfer',
  TOKEN_METHOD_TRANSFER_FROM: 'transferfrom',
};

export const MOCK_TRANSACTION_BY_TYPE = {
  [MOCK_TX_TYPE.CANCEL]: {
    id: 643368596521636,
    time: 1653527035634,
    status: 'submitted',
    originalGasEstimate: '5208',
    userEditedGasLimit: false,
    chainId: '0x5',
    loadingDefaults: false,
    dappSuggestedGasFees: null,
    sendFlowHistory: [],
    txParams: {
      from: '0xabce7847fd3661a9b7c86aaf1daea08d9da5750e',
      to: '0xefge7847fd3661a9b7c86aaf1daea08d9da5750e',
      nonce: '0x51',
      value: '0x0',
      gas: '0x5208',
      gasPrice: '0x59682f0e',
      estimateSuggested: 'medium',
      estimateUsed: 'custom',
    },
    previousGasParams: {
      gasPrice: '0x3b9aca00',
    },
    type: 'cancel',
    history: [
      {
        id: 643368596521636,
        time: 1653527035634,
        status: 'approved',
        originalGasEstimate: '5208',
        userEditedGasLimit: false,
        chainId: '0x5',
        loadingDefaults: false,
        dappSuggestedGasFees: null,
        sendFlowHistory: [],
        txParams: {
          from: '0xabce7847fd3661a9b7c86aaf1daea08d9da5750e',
          to: '0xefge7847fd3661a9b7c86aaf1daea08d9da5750e',
          nonce: '0x51',
          value: '0x0',
          gas: '0x5208',
          gasPrice: '0x59682f0e',
          estimateSuggested: 'medium',
          estimateUsed: 'custom',
        },
        previousGasParams: {
          gasPrice: '0x3b9aca00',
        },
        type: 'cancel',
      },
      [
        {
          op: 'add',
          path: '/r',
          value:
            '0xb66eff07d9061c42e47ccf5f6a52b6626ef4d5b10e50d8aa6b8f20ae645fe347',
          note: 'transactions#signTransaction: add r, s, v values',
          timestamp: 1653527035817,
        },
        {
          op: 'add',
          path: '/s',
          value:
            '0x3a2da8d56beff82a2d59e807f7d578f0c3b4b99cd6d3735c72c133d06fe02a9d',
        },
        {
          op: 'add',
          path: '/v',
          value: '0x2b',
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'signed',
          note: 'txStateManager: setting status to signed',
          timestamp: 1653527035818,
        },
      ],
      [
        {
          op: 'add',
          path: '/rawTx',
          value:
            '0xf863518459682f0e82520894e56e7847fd3661a9b7c86aaf1daea08d9da5750e80802ba0b66eff07d9061c42e47ccf5f6a52b6626ef4d5b10e50d8aa6b8f20ae645fe347a03a2da8d56beff82a2d59e807f7d578f0c3b4b99cd6d3735c72c133d06fe02a9d',
          note: 'transactions#publishTransaction',
          timestamp: 1653527035819,
        },
      ],
      [
        {
          op: 'add',
          path: '/hash',
          value:
            '0xb7628b82716108edcfe84dfd6ed49b219bc019e3fc6e96cf95548c32a67c1cbc',
          note: 'transactions#setTxHash',
          timestamp: 1653527035923,
        },
      ],
      [
        {
          op: 'add',
          path: '/submittedTime',
          value: 1653527035924,
          note: 'txStateManager - add submitted time stamp',
          timestamp: 1653527035924,
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'submitted',
          note: 'txStateManager: setting status to submitted',
          timestamp: 1653527035925,
        },
      ],
    ],
    r: '0xb66eff07d9061c42e47ccf5f6a52b6626ef4d5b10e50d8aa6b8f20ae645fe347',
    s: '0x3a2da8d56beff82a2d59e807f7d578f0c3b4b99cd6d3735c72c133d06fe02a9d',
    v: '0x2b',
    rawTx:
      '0xf863518459682f0e82520894e56e7847fd3661a9b7c86aaf1daea08d9da5750e80802ba0b66eff07d9061c42e47ccf5f6a52b6626ef4d5b10e50d8aa6b8f20ae645fe347a03a2da8d56beff82a2d59e807f7d578f0c3b4b99cd6d3735c72c133d06fe02a9d',
    hash: '0xb7628b82716108edcfe84dfd6ed49b219bc019e3fc6e96cf95548c32a67c1cbc',
    submittedTime: 1653527035924,
  },
  [MOCK_TX_TYPE.CONTRACT_INTERACTION]: {
    chainId: '0x5',
    dappSuggestedGasFees: {
      gas: '0x118f4',
      maxFeePerGas: '0x9502f91a',
      maxPriorityFeePerGas: '0x9502F900',
    },
    id: 7694052085150913,
    loadingDefaults: true,
    origin: 'https://remix.ethereum.org',
    originalGasEstimate: '0x118f4',
    sendFlowHistory: [],
    status: 'unapproved',
    time: 1653417884003,
    txParams: {
      data:
        '0xa1448194000000000000000000000000e56e7847fd3661a9b7c86aaf1daea08d9da5750e0000000000000000000000000000000000000000000000000000000000000004',
      from: '0xabce7847fd3661a9b7c86aaf1daea08d9da5750e',
      gas: '0x118f4',
      maxFeePerGas: '0x9502f91a',
      maxPriorityFeePerGas: '0x9502F900',
      to: '0xefg6c980a3fcd3100503d8f80537eefcee516d67',
      type: '0x2',
      value: '0x0',
    },
    type: 'contractInteraction',
    userEditedGasLimit: false,
  },
  [MOCK_TX_TYPE.DEPLOY_CONTRACT]: {
    blockNumber: '6195527',
    id: 4243712234858468,
    chainId: '0x5',
    status: 'confirmed',
    time: 1585088013000,
    txParams: {
      from: '0xabc14609ef9e09776ac5fe00bdbfef57bcdefebb',
      gas: '0x5208',
      gasPrice: '0x77359400',
      nonce: '0x3',
      value: '0x00',
      data:
        '0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029',
    },
    hash: '0xbcb195f393f4468945b4045cd41bcdbc2f19ad75ae92a32cf153a3004e42009a',
    type: 'contractDeployment',
    origin: 'https://metamask.github.io',
  },
  [MOCK_TX_TYPE.ETH_DECRYPT]: {
    id: 5177046356058652,
    msgParams: {
      from: '0xabce7847fd3661a9b7c86aaf1daea08d9da5750e',
      data:
        '0x7b2276657273696f6e223a227832353531392d7873616c736132302d706f6c7931333035222c226e6f6e6365223a22415a7a535971376139725531396e3835753174494f5765367a486e32775a6166222c22657068656d5075626c69634b6579223a2251336d346650474a6b6a32396d44766f7133536a77616733686b3651366571744236397671795258517a673d222c2263697068657274657874223a223943556d614c327a69635a5838584c4d5a75646b58392f6531544770384d61513135776276774c6d442b4235772b4f706655694c586c586d55355536645339675638584c61445557446e656735546b3d227d',
      origin: 'https://metamask.github.io',
    },
    time: 1653450860396,
    txParams: {
      from: '0xabc14609ef9e09776ac5fe00bdbfef57bcdefebb',
      gas: '0x5208',
      gasPrice: '0x77359400',
      nonce: '0x3',
      value: '0x00',
      data:
        '0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029',
    },
    status: 'unapproved',
    type: 'eth_decrypt',
  },
  [MOCK_TX_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY]: {
    id: 5177046356058645,
    msgParams: '0xe56e7847fd3661a9b7c86aaf1daea08d9da5750e',
    time: 1653450802102,
    status: 'unapproved',
    txParams: {
      from: '0xabc14609ef9e09776ac5fe00bdbfef57bcdefebb',
      gas: '0x5208',
      gasPrice: '0x77359400',
      nonce: '0x3',
      value: '0x00',
      data:
        '0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029',
    },
    type: 'eth_getEncryptionPublicKey',
    origin: 'https://metamask.github.io',
  },
  [MOCK_TX_TYPE.INCOMING]: {
    blockNumber: '6477257',
    id: 4243712234858505,
    chainId: '0x5',
    status: 'confirmed',
    time: 1589314295000,
    txParams: {
      from: '0xabc98d14007bdee637298086988a0bbd31184523',
      gas: '0x5208',
      gasPrice: '0x3b9aca00',
      nonce: '0x56540',
      to: '0xefga64466f257793eaa52fcfff5066894b76a149',
      value: '0x1043561a882930000',
    },
    hash: '0x5ca26d1cdcabef1ac2ad5b2b38604c9ced65d143efc7525f848c46f28e0e4116',
    type: 'incoming',
  },
  [MOCK_TX_TYPE.PERSONAL_SIGN]: {
    id: 5177046356058671,
    msgParams: {
      0: 'E',
      1: 'x',
      2: 'a',
      3: 'm',
      4: 'p',
      5: 'l',
      6: 'e',
      7: ' ',
      8: 'p',
      9: 'a',
      10: 's',
      11: 's',
      12: 'w',
      13: 'o',
      14: 'r',
      15: 'd',
      from: '0xabce7847fd3661a9b7c86aaf1daea08d9da5750e',
      data: '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
      origin: 'https://metamask.github.io',
    },
    txParams: {
      from: '0xabc14609ef9e09776ac5fe00bdbfef57bcdefebb',
      gas: '0x5208',
      gasPrice: '0x77359400',
      nonce: '0x3',
      value: '0x00',
      data:
        '0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029',
    },
    time: 1653451036121,
    status: 'unapproved',
    type: 'personal_sign',
  },
  [MOCK_TX_TYPE.RETRY]: {
    id: 3938342322880462,
    time: 1653459456297,
    status: 'failed',
    chainId: '0x5',
    originalGasEstimate: '14609',
    userEditedGasLimit: false,
    chainId: '0x5',
    loadingDefaults: false,
    dappSuggestedGasFees: null,
    sendFlowHistory: [],
    txParams: {
      from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
      nonce: '0x7',
      value: '0x0',
      data:
        '0x6080604052348015600f57600080fd5b50608b8061001e6000396000f3fe6080604052610fff3411600e57fe5b3373ffffffffffffffffffffffffffffffffffffffff166108fc349081150290604051600060405180830381858888f193505050501580156053573d6000803e3d6000fd5b5000fea265627a7a72315820631b0dbb6b871cdbfdec2773af15ebfb8e52c794cf836fe27ec21f1aed17180f64736f6c634300050c0032',
      gas: '0x14609',
      maxFeePerGas: '0x3b9aca0d',
      maxPriorityFeePerGas: '0x3b9aca00',
      estimateSuggested: 'medium',
      estimateUsed: 'low',
    },
    previousGasParams: {
      maxFeePerGas: '0x3b9aca0b',
      maxPriorityFeePerGas: '0xbebc200',
    },
    type: 'retry',
    estimatedBaseFee: 'd',
    history: [
      {
        id: 3938342322880462,
        time: 1653459456297,
        status: 'approved',
        originalGasEstimate: '14609',
        userEditedGasLimit: false,
        chainId: '0x5',
        loadingDefaults: false,
        dappSuggestedGasFees: null,
        sendFlowHistory: [],
        txParams: {
          from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
          nonce: '0x7',
          value: '0x0',
          data:
            '0x6080604052348015600f57600080fd5b50608b8061001e6000396000f3fe6080604052610fff3411600e57fe5b3373ffffffffffffffffffffffffffffffffffffffff166108fc349081150290604051600060405180830381858888f193505050501580156053573d6000803e3d6000fd5b5000fea265627a7a72315820631b0dbb6b871cdbfdec2773af15ebfb8e52c794cf836fe27ec21f1aed17180f64736f6c634300050c0032',
          gas: '0x14609',
          maxFeePerGas: '0x3b9aca0d',
          maxPriorityFeePerGas: '0x3b9aca00',
          estimateSuggested: 'medium',
          estimateUsed: 'low',
        },
        previousGasParams: {
          maxFeePerGas: '0x3b9aca0b',
          maxPriorityFeePerGas: '0xbebc200',
        },
        type: 'retry',
        estimatedBaseFee: 'd',
      },
      [
        {
          op: 'add',
          path: '/r',
          value:
            '0xde2e3131fb55b1edd182de128453521c86eed588f92058b61b3ce56cdfb33a26',
          note: 'transactions#signTransaction: add r, s, v values',
          timestamp: 1653459456512,
        },
        {
          op: 'add',
          path: '/s',
          value:
            '0x64ee1eef8d0fa1b35e122658554d16645366e8977253fc1c47d030f28736409b',
        },
        {
          op: 'add',
          path: '/v',
          value: '0x00',
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'signed',
          note: 'txStateManager: setting status to signed',
          timestamp: 1653459456512,
        },
      ],
      [
        {
          op: 'add',
          path: '/rawTx',
          value:
            '0x02f901010407843b9aca00843b9aca0d830146098080b8a96080604052348015600f57600080fd5b50608b8061001e6000396000f3fe6080604052610fff3411600e57fe5b3373ffffffffffffffffffffffffffffffffffffffff166108fc349081150290604051600060405180830381858888f193505050501580156053573d6000803e3d6000fd5b5000fea265627a7a72315820631b0dbb6b871cdbfdec2773af15ebfb8e52c794cf836fe27ec21f1aed17180f64736f6c634300050c0032c080a0de2e3131fb55b1edd182de128453521c86eed588f92058b61b3ce56cdfb33a26a064ee1eef8d0fa1b35e122658554d16645366e8977253fc1c47d030f28736409b',
          note: 'transactions#publishTransaction',
          timestamp: 1653459456514,
        },
      ],
      [
        {
          op: 'add',
          path: '/err',
          value: {
            message:
              '[ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32000,"message":"replacement transaction underpriced"}}\'',
            stack:
              'Error: [ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32000,"message":"replacement transaction underpriced"}}\'\n  at chrome-extension://hbljfohiafgaaaabejngpgolnboohpaf/common-5.js:14346:29',
          },
          note: 'transactions:tx-state-manager#fail - add error',
          timestamp: 1653459456632,
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'failed',
          note: 'txStateManager: setting status to failed',
          timestamp: 1653459456633,
        },
      ],
    ],
    r: '0xde2e3131fb55b1edd182de128453521c86eed588f92058b61b3ce56cdfb33a26',
    s: '0x64ee1eef8d0fa1b35e122658554d16645366e8977253fc1c47d030f28736409b',
    v: '0x00',
    rawTx:
      '0x02f901010407843b9aca00843b9aca0d830146098080b8a96080604052348015600f57600080fd5b50608b8061001e6000396000f3fe6080604052610fff3411600e57fe5b3373ffffffffffffffffffffffffffffffffffffffff166108fc349081150290604051600060405180830381858888f193505050501580156053573d6000803e3d6000fd5b5000fea265627a7a72315820631b0dbb6b871cdbfdec2773af15ebfb8e52c794cf836fe27ec21f1aed17180f64736f6c634300050c0032c080a0de2e3131fb55b1edd182de128453521c86eed588f92058b61b3ce56cdfb33a26a064ee1eef8d0fa1b35e122658554d16645366e8977253fc1c47d030f28736409b',
    err: {
      message:
        '[ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32000,"message":"replacement transaction underpriced"}}\'',
      stack:
        'Error: [ethjs-query] while formatting outputs from RPC \'{"value":{"code":-32000,"message":"replacement transaction underpriced"}}\'\n  at chrome-extension://hbljfohiafgaaaabejngpgolnboohpaf/common-5.js:14346:29',
    },
  },
  [MOCK_TX_TYPE.SIGN]: {
    id: 5177046356058675,
    msgParams: {
      from: '0xabce7847fd3661a9b7c86aaf1daea08d9da5750e',
      data:
        '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
      origin: 'https://metamask.github.io',
    },
    txParams: {
      from: '0xabc14609ef9e09776ac5fe00bdbfef57bcdefebb',
      gas: '0x5208',
      gasPrice: '0x77359400',
      nonce: '0x3',
      value: '0x00',
      data:
        '0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029',
    },
    time: 1653451051909,
    status: 'unapproved',
    type: 'eth_sign',
  },
  [MOCK_TX_TYPE.SIGN_TYPED_DATA]: {
    id: 5177046356058598,
    msgParams: {
      from: '0xabce7847fd3661a9b7c86aaf1daea08d9da5750e',
      data: [
        {
          type: 'string',
          name: 'Message',
          value: 'Hi, Alice!',
        },
        {
          type: 'uint32',
          name: 'A number',
          value: '1337',
        },
      ],
      version: 'V1',
      origin: 'https://metamask.github.io',
    },
    txParams: {
      from: '0xabc14609ef9e09776ac5fe00bdbfef57bcdefebb',
      gas: '0x5208',
      gasPrice: '0x77359400',
      nonce: '0x3',
      value: '0x00',
      data:
        '0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029',
    },
    time: 1653450005954,
    status: 'unapproved',
    type: 'eth_signTypedData',
  },
  [MOCK_TX_TYPE.SIMPLE_SEND]: {
    id: 4243712234858512,
    time: 1589314601567,
    status: 'confirmed',
    chainId: '0x5',
    loadingDefaults: false,
    txParams: {
      from: '0xabca64466f257793eaa52fcfff5066894b76a149',
      to: '0xefg5bc4e8f1f969934d773fa67da095d2e491a97',
      nonce: '0xc',
      value: '0xde0b6b3a7640000',
      gas: '0x5208',
      gasPrice: '0x2540be400',
    },
    origin: 'metamask',
    type: 'simpleSend',
  },
  [MOCK_TX_TYPE.SMART]: {
    blockNumber: '6195527',
    id: 4243712234858468,
    chainId: '0x5',
    status: 'confirmed',
    time: 1585088013000,
    txParams: {
      from: '0xabc14609ef9e09776ac5fe00bdbfef57bcdefebb',
      gas: '0x5208',
      gasPrice: '0x77359400',
      nonce: '0x3',
      value: '0x00',
      data:
        '0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029',
    },
    hash: '0xbcb195f393f4468945b4045cd41bcdbc2f19ad75ae92a32cf153a3004e42009a',
    transactionType: 'smart',
    type: 'contractDeployment',
    origin: 'https://metamask.github.io',
  },
  [MOCK_TX_TYPE.SWAP]: {
    blockNumber: '6195527',
    id: 4243712234858467,
    chainId: '0x5',
    status: 'confirmed',
    time: 1585088013000,
    txParams: {
      from: '0xabc14609ef9e09776ac5fe00bdbfef57bcdefebb',
      gas: '0x5208',
      gasPrice: '0x77359400',
      nonce: '0x3',
      to: '0xefga64466f257793eaa52fcfff5066894b76a149',
      value: '0xde0b6b3a7640000',
    },
    hash: '0xbcb195f393f4468945b4045cd41bcdbc2f19ad75ae92a32cf153a3004e42009a',
    destinationTokenSymbol: 'ABC',
    sourceTokenSymbol: 'ETH',
    type: 'swap',
  },
  [MOCK_TX_TYPE.SWAP_APPROVAL]: {
    blockNumber: '6195527',
    id: 4243712234858467,
    chainId: '0x5',
    status: 'confirmed',
    time: 1585088013000,
    txParams: {
      from: '0xabc14609ef9e09776ac5fe00bdbfef57bcdefebb',
      gas: '0x5208',
      gasPrice: '0x77359400',
      nonce: '0x3',
      to: '0xefga64466f257793eaa52fcfff5066894b76a149',
      value: '0xde0b6b3a7640000',
    },
    hash: '0xbcb195f393f4468945b4045cd41bcdbc2f19ad75ae92a32cf153a3004e42009a',
    destinationTokenSymbol: 'ABC',
    type: 'swapApproval',
    sourceTokenSymbol: 'XBN',
  },
  [MOCK_TX_TYPE.TOKEN_METHOD_APPROVE]: {
    id: 5177046356058729,
    time: 1653457101080,
    status: 'submitted',
    originalGasEstimate: '0xb427',
    userEditedGasLimit: false,
    chainId: '0x5',
    loadingDefaults: false,
    dappSuggestedGasFees: {
      gasPrice: '0x4a817c800',
      gas: '0xb427',
    },
    sendFlowHistory: [],
    txParams: {
      from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
      to: '0xefg60bbf4ba1de43f3b4983a539feebfbd5fd976',
      nonce: '0x5',
      value: '0x0',
      data:
        '0x095ea7b30000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000011170',
      gas: '0xb427',
      maxFeePerGas: '0x4a817c800',
      maxPriorityFeePerGas: '0x4a817c800',
    },
    origin: 'https://metamask.github.io',
    type: 'approve',
    history: [
      {
        id: 5177046356058729,
        time: 1653457101080,
        status: 'unapproved',
        chainId: '0x5',
        originalGasEstimate: '0xb427',
        userEditedGasLimit: false,
        chainId: '0x5',
        loadingDefaults: true,
        dappSuggestedGasFees: {
          gasPrice: '0x4a817c800',
          gas: '0xb427',
        },
        sendFlowHistory: [],
        txParams: {
          from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
          to: '0xefg60bbf4ba1de43f3b4983a539feebfbd5fd976',
          value: '0x0',
          data:
            '0x095ea7b30000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000011170',
          gas: '0xb427',
          gasPrice: '0x4a817c800',
        },
        origin: 'https://metamask.github.io',
        type: 'approve',
      },
      [
        {
          op: 'remove',
          path: '/txParams/gasPrice',
          note: 'Added new unapproved transaction.',
          timestamp: 1653457101715,
        },
        {
          op: 'add',
          path: '/txParams/maxFeePerGas',
          value: '0x4a817c800',
        },
        {
          op: 'add',
          path: '/txParams/maxPriorityFeePerGas',
          value: '0x4a817c800',
        },
        {
          op: 'replace',
          path: '/loadingDefaults',
          value: false,
        },
        {
          op: 'add',
          path: '/userFeeLevel',
          value: 'custom',
        },
        {
          op: 'add',
          path: '/defaultGasEstimates',
          value: {
            estimateType: 'custom',
            gas: '0xb427',
            maxFeePerGas: '0x4a817c800',
            maxPriorityFeePerGas: '0x4a817c800',
          },
        },
      ],
      [
        {
          op: 'add',
          path: '/estimatedBaseFee',
          value: '14',
          note: 'confTx: user approved transaction',
          timestamp: 1653457117006,
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'approved',
          note: 'txStateManager: setting status to approved',
          timestamp: 1653457117008,
        },
      ],
      [
        {
          op: 'add',
          path: '/txParams/nonce',
          value: '0x5',
          note: 'transactions#approveTransaction',
          timestamp: 1653457117294,
        },
      ],
      [
        {
          op: 'add',
          path: '/r',
          value:
            '0xfdd2cb46203b5e7bba99cc56a37da3e5e3f36163a5bd9c51cddfd8d7028f5dd0',
          note: 'transactions#signTransaction: add r, s, v values',
          timestamp: 1653457117407,
        },
        {
          op: 'add',
          path: '/s',
          value:
            '0x54c35cfa10b3350a3fd3a0e7b4aeb0b603d528c07a8cfdf4a78505d9864edef4',
        },
        {
          op: 'add',
          path: '/v',
          value: '0x00',
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'signed',
          note: 'txStateManager: setting status to signed',
          timestamp: 1653457117408,
        },
      ],
      [
        {
          op: 'add',
          path: '/rawTx',
          value:
            '0x02f8b104058504a817c8008504a817c80082b427949ba60bbf4ba1de43f3b4983a539feebfbd5fd97680b844095ea7b30000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000011170c080a0fdd2cb46203b5e7bba99cc56a37da3e5e3f36163a5bd9c51cddfd8d7028f5dd0a054c35cfa10b3350a3fd3a0e7b4aeb0b603d528c07a8cfdf4a78505d9864edef4',
          note: 'transactions#publishTransaction',
          timestamp: 1653457117410,
        },
      ],
      [
        {
          op: 'add',
          path: '/hash',
          value:
            '0x75b35f5b9a95c8e4b1a242be5b163c7a1b18822191b0b1de6985a8b9d3abfe26',
          note: 'transactions#setTxHash',
          timestamp: 1653457118158,
        },
      ],
      [
        {
          op: 'add',
          path: '/submittedTime',
          value: 1653457118159,
          note: 'txStateManager - add submitted time stamp',
          timestamp: 1653457118160,
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'submitted',
          note: 'txStateManager: setting status to submitted',
          timestamp: 1653457118161,
        },
      ],
    ],
    userFeeLevel: 'custom',
    defaultGasEstimates: {
      estimateType: 'custom',
      gas: '0xb427',
      maxFeePerGas: '0x4a817c800',
      maxPriorityFeePerGas: '0x4a817c800',
    },
    estimatedBaseFee: '14',
    r: '0xfdd2cb46203b5e7bba99cc56a37da3e5e3f36163a5bd9c51cddfd8d7028f5dd0',
    s: '0x54c35cfa10b3350a3fd3a0e7b4aeb0b603d528c07a8cfdf4a78505d9864edef4',
    v: '0x00',
    rawTx:
      '0x02f8b104058504a817c8008504a817c80082b427949ba60bbf4ba1de43f3b4983a539feebfbd5fd97680b844095ea7b30000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000011170c080a0fdd2cb46203b5e7bba99cc56a37da3e5e3f36163a5bd9c51cddfd8d7028f5dd0a054c35cfa10b3350a3fd3a0e7b4aeb0b603d528c07a8cfdf4a78505d9864edef4',
    hash: '0x75b35f5b9a95c8e4b1a242be5b163c7a1b18822191b0b1de6985a8b9d3abfe26',
    submittedTime: 1653457118159,
  },
  [MOCK_TX_TYPE.TOKEN_METHOD_SAFE_TRANSFER_FROM]: {
    id: 1441203963845330,
    time: 1652206763566,
    status: 'confirmed',
    chainId: '0x5',
    originalGasEstimate: '0x118e0',
    userEditedGasLimit: false,
    chainId: '0x5',
    loadingDefaults: false,
    dappSuggestedGasFees: {
      maxPriorityFeePerGas: '0x3B9ACA00',
      maxFeePerGas: '0x7be830aec',
    },
    sendFlowHistory: [],
    txParams: {
      from: '0xabc627172af48bd5b0765d3449a7def80d6576ff',
      to: '0xefge760f2e916647fd766b4ad9e85ff943ce3a2b',
      nonce: '0x57',
      value: '0x0',
      data:
        '0x42842e0e000000000000000000000000806627172af48bd5b0765d3449a7def80d6576ff000000000000000000000000e7d522230eff653bb0a9b4385f0be0815420dd98000000000000000000000000000000000000000000000000000000000009a7cc',
      gas: '0x118e0',
      maxFeePerGas: '0x7be830aec',
      maxPriorityFeePerGas: '0x3B9ACA00',
    },
    origin: 'https://goerli.etherscan.io',
    type: 'safetransferfrom',
    userFeeLevel: 'dappSuggested',
    defaultGasEstimates: {
      estimateType: 'dappSuggested',
      gas: '0x118e0',
      maxFeePerGas: '0x7be830aec',
      maxPriorityFeePerGas: '0x3B9ACA00',
    },
    estimatedBaseFee: '3ba182755',
    r: '0xd13310569a8d5876e37788183034bfe4bc3b49c0663c5fd9b2bf13adf9b4791c',
    s: '0x7a83d8840e7edcdf4fdedfd2bc1ce19775e54fd17f29ede5165591a1cf3febea',
    v: '0x00',
    rawTx:
      '0x02f8d10457843b9aca008507be830aec830118e094f5de760f2e916647fd766b4ad9e85ff943ce3a2b80b86442842e0e000000000000000000000000806627172af48bd5b0765d3449a7def80d6576ff000000000000000000000000e7d522230eff653bb0a9b4385f0be0815420dd98000000000000000000000000000000000000000000000000000000000009a7ccc080a0d13310569a8d5876e37788183034bfe4bc3b49c0663c5fd9b2bf13adf9b4791ca07a83d8840e7edcdf4fdedfd2bc1ce19775e54fd17f29ede5165591a1cf3febea',
    hash: '0xe8717d7b075f8bb555cd4bb9846659a7dfba70dc017a84782a2d23d21f948ee3',
    submittedTime: 1652206777046,
    txReceipt: {
      blockHash:
        '0x75eb415f79d24f62821b979e3a5f0d4904b2381e973da5fadbddc046c701e3d1',
      blockNumber: 'a28e39',
      contractAddress: null,
      cumulativeGasUsed: 'fd5dee',
      effectiveGasPrice: '0x4028dcaf1',
      from: '0xabc627172af48bd5b0765d3449a7def80d6576ff',
      gasUsed: 'bb40',
      logs: [
        {
          address: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
          blockHash:
            '0x75eb415f79d24f62821b979e3a5f0d4904b2381e973da5fadbddc046c701e3d1',
          blockNumber: 'a28e39',
          data: '0x',
          logIndex: '45',
          removed: false,
          topics: [
            '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
            '0x000000000000000000000000806627172af48bd5b0765d3449a7def80d6576ff',
            '0x0000000000000000000000000000000000000000000000000000000000000000',
            '0x000000000000000000000000000000000000000000000000000000000009a7cc',
          ],
          transactionHash:
            '0xe8717d7b075f8bb555cd4bb9846659a7dfba70dc017a84782a2d23d21f948ee3',
          transactionIndex: '23',
        },
        {
          address: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
          blockHash:
            '0x75eb415f79d24f62821b979e3a5f0d4904b2381e973da5fadbddc046c701e3d1',
          blockNumber: 'a28e39',
          data: '0x',
          logIndex: '46',
          removed: false,
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0x000000000000000000000000806627172af48bd5b0765d3449a7def80d6576ff',
            '0x000000000000000000000000e7d522230eff653bb0a9b4385f0be0815420dd98',
            '0x000000000000000000000000000000000000000000000000000000000009a7cc',
          ],
          transactionHash:
            '0xe8717d7b075f8bb555cd4bb9846659a7dfba70dc017a84782a2d23d21f948ee3',
          transactionIndex: '23',
        },
      ],
      logsBloom:
        '0x00000000000000001000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000008000200000000000000000000000000008000000000000000000008000000000000000000000000000020800000000000000000800000000000000000000000010000000000000000000000000000080000010000000000000000000000000000000000000020000000000000000000001000000000000000000000000000000000000000000000202000000000000000000000800000000000000000000000000000020000010000000000002008000000000000000000000000000000000000000000000',
      status: '0x1',
      to: '0xefge760f2e916647fd766b4ad9e85ff943ce3a2b',
      transactionHash:
        '0xe8717d7b075f8bb555cd4bb9846659a7dfba70dc017a84782a2d23d21f948ee3',
      transactionIndex: '23',
      type: '0x2',
    },
    baseFeePerGas: '0x3c6f300f1',
    blockTimestamp: '627aacc2',
  },
  [MOCK_TX_TYPE.TOKEN_METHOD_TRANSFER]: {
    id: 5177046356058725,
    time: 1653457077370,
    status: 'confirmed',
    chainId: '0x5',
    originalGasEstimate: '0xea60',
    userEditedGasLimit: false,
    chainId: '0x5',
    loadingDefaults: false,
    dappSuggestedGasFees: {
      gasPrice: '0x4a817c800',
      gas: '0xea60',
    },
    sendFlowHistory: [],
    txParams: {
      from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
      to: '0xefg60bbf4ba1de43f3b4983a539feebfbd5fd976',
      nonce: '0x5',
      value: '0x0',
      data:
        '0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000003a98',
      gas: '0xea60',
      maxFeePerGas: '0x4a817c800',
      maxPriorityFeePerGas: '0x4a817c800',
    },
    origin: 'https://metamask.github.io',
    type: 'transfer',
    history: [
      {
        id: 5177046356058725,
        time: 1653457077370,
        status: 'unapproved',
        chainId: '0x5',
        originalGasEstimate: '0xea60',
        userEditedGasLimit: false,
        chainId: '0x5',
        loadingDefaults: true,
        dappSuggestedGasFees: {
          gasPrice: '0x4a817c800',
          gas: '0xea60',
        },
        sendFlowHistory: [],
        txParams: {
          from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
          to: '0xefg60bbf4ba1de43f3b4983a539feebfbd5fd976',
          value: '0x0',
          data:
            '0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000003a98',
          gas: '0xea60',
          gasPrice: '0x4a817c800',
        },
        origin: 'https://metamask.github.io',
        type: 'transfer',
      },
      [
        {
          op: 'remove',
          path: '/txParams/gasPrice',
          note: 'Added new unapproved transaction.',
          timestamp: 1653457077808,
        },
        {
          op: 'add',
          path: '/txParams/maxFeePerGas',
          value: '0x4a817c800',
        },
        {
          op: 'add',
          path: '/txParams/maxPriorityFeePerGas',
          value: '0x4a817c800',
        },
        {
          op: 'replace',
          path: '/loadingDefaults',
          value: false,
        },
        {
          op: 'add',
          path: '/userFeeLevel',
          value: 'custom',
        },
        {
          op: 'add',
          path: '/defaultGasEstimates',
          value: {
            estimateType: 'custom',
            gas: '0xea60',
            maxFeePerGas: '0x4a817c800',
            maxPriorityFeePerGas: '0x4a817c800',
          },
        },
      ],
      [
        {
          op: 'add',
          path: '/estimatedBaseFee',
          value: '16',
          note: 'confTx: user approved transaction',
          timestamp: 1653457091914,
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'approved',
          note: 'txStateManager: setting status to approved',
          timestamp: 1653457091915,
        },
      ],
      [
        {
          op: 'add',
          path: '/txParams/nonce',
          value: '0x5',
          note: 'transactions#approveTransaction',
          timestamp: 1653457091939,
        },
      ],
      [
        {
          op: 'add',
          path: '/r',
          value:
            '0xb0f36e4392f9d302351789aef355a2e95b979bcdd99d19026c533152563d3bce',
          note: 'transactions#signTransaction: add r, s, v values',
          timestamp: 1653457092053,
        },
        {
          op: 'add',
          path: '/s',
          value:
            '0x08e59de373e65c9c54e6a8052585461e81409d33178464f9b72f4cc36ac75d40',
        },
        {
          op: 'add',
          path: '/v',
          value: '0x01',
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'signed',
          note: 'txStateManager: setting status to signed',
          timestamp: 1653457092054,
        },
      ],
      [
        {
          op: 'add',
          path: '/rawTx',
          value:
            '0x02f8b104048504a817c8008504a817c80082ea60949ba60bbf4ba1de43f3b4983a539feebfbd5fd97680b844a9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000003a98c001a0b0f36e4392f9d302351789aef355a2e95b979bcdd99d19026c533152563d3bcea008e59de373e65c9c54e6a8052585461e81409d33178464f9b72f4cc36ac75d40',
          note: 'transactions#publishTransaction',
          timestamp: 1653457092056,
        },
      ],
      [
        {
          op: 'add',
          path: '/hash',
          value:
            '0x3a8ed11c3d0ac26e4fe07812a29efdb642f15b8d83d2716ddf80d11b2542916f',
          note: 'transactions#setTxHash',
          timestamp: 1653457092526,
        },
      ],
      [
        {
          op: 'add',
          path: '/submittedTime',
          value: 1653457092527,
          note: 'txStateManager - add submitted time stamp',
          timestamp: 1653457092527,
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'submitted',
          note: 'txStateManager: setting status to submitted',
          timestamp: 1653457092529,
        },
      ],
      [
        {
          op: 'add',
          path: '/firstRetryBlockNumber',
          value: '0xa3d199',
          note: 'transactions/pending-tx-tracker#event: tx:block-update',
          timestamp: 1653457094748,
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'confirmed',
          note: 'txStateManager: setting status to confirmed',
          timestamp: 1653457115712,
        },
        {
          op: 'add',
          path: '/txReceipt',
          value: {
            blockHash:
              '0x243a362e5fda0d6ec8fce3d7f727679148c1df8ec6d7470ff65b38c8a96823b4',
            blockNumber: 'a3d19a',
            contractAddress: null,
            cumulativeGasUsed: 'ca21',
            effectiveGasPrice: '0x4a817c800',
            from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
            gasUsed: 'ca21',
            logs: [
              {
                address: '0x9ba60bbf4ba1de43f3b4983a539feebfbd5fd976',
                blockHash:
                  '0x243a362e5fda0d6ec8fce3d7f727679148c1df8ec6d7470ff65b38c8a96823b4',
                blockNumber: 'a3d19a',
                data:
                  '0x0000000000000000000000000000000000000000000000000000000000003a98',
                logIndex: '0',
                removed: false,
                topics: [
                  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                  '0x000000000000000000000000ac9539a7d5c43940af498008a7c8f3abb35c3725',
                  '0x0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c970',
                ],
                transactionHash:
                  '0x3a8ed11c3d0ac26e4fe07812a29efdb642f15b8d83d2716ddf80d11b2542916f',
                transactionIndex: '0',
              },
            ],
            logsBloom:
              '0x00000000000000000000000000000000000000000000001000000100000100000000000000000000000000000000000000000000000000000000000000000000000000000020000000000008000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000100000000000000000000000000000000000000000000000000000000000000000000000800000004000000000000001000000000000000',
            status: '0x1',
            to: '0xefg60bbf4ba1de43f3b4983a539feebfbd5fd976',
            transactionHash:
              '0x3a8ed11c3d0ac26e4fe07812a29efdb642f15b8d83d2716ddf80d11b2542916f',
            transactionIndex: '0',
            type: '0x2',
          },
        },
        {
          op: 'add',
          path: '/baseFeePerGas',
          value: '0x14',
        },
        {
          op: 'add',
          path: '/blockTimestamp',
          value: '628dc0c8',
        },
      ],
      [
        {
          op: 'replace',
          path: '/blockTimestamp',
          value: '628dc0c8',
          note: 'transactions#confirmTransaction - add txReceipt',
          timestamp: 1653457115870,
        },
        {
          op: 'replace',
          path: '/txReceipt/transactionIndex',
          value: '0',
        },
        {
          op: 'replace',
          path: '/txReceipt/logs/0/transactionIndex',
          value: '0',
        },
        {
          op: 'replace',
          path: '/txReceipt/logs/0/logIndex',
          value: '0',
        },
        {
          op: 'replace',
          path: '/txReceipt/logs/0/blockNumber',
          value: 'a3d19a',
        },
        {
          op: 'replace',
          path: '/txReceipt/cumulativeGasUsed',
          value: 'ca21',
        },
        {
          op: 'replace',
          path: '/txReceipt/blockNumber',
          value: 'a3d19a',
        },
      ],
    ],
    userFeeLevel: 'custom',
    defaultGasEstimates: {
      estimateType: 'custom',
      gas: '0xea60',
      maxFeePerGas: '0x4a817c800',
      maxPriorityFeePerGas: '0x4a817c800',
    },
    estimatedBaseFee: '16',
    r: '0xb0f36e4392f9d302351789aef355a2e95b979bcdd99d19026c533152563d3bce',
    s: '0x08e59de373e65c9c54e6a8052585461e81409d33178464f9b72f4cc36ac75d40',
    v: '0x01',
    rawTx:
      '0x02f8b104048504a817c8008504a817c80082ea60949ba60bbf4ba1de43f3b4983a539feebfbd5fd97680b844a9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000003a98c001a0b0f36e4392f9d302351789aef355a2e95b979bcdd99d19026c533152563d3bcea008e59de373e65c9c54e6a8052585461e81409d33178464f9b72f4cc36ac75d40',
    hash: '0x3a8ed11c3d0ac26e4fe07812a29efdb642f15b8d83d2716ddf80d11b2542916f',
    submittedTime: 1653457092527,
    firstRetryBlockNumber: '0xa3d199',
    txReceipt: {
      blockHash:
        '0x243a362e5fda0d6ec8fce3d7f727679148c1df8ec6d7470ff65b38c8a96823b4',
      blockNumber: 'a3d19a',
      contractAddress: null,
      cumulativeGasUsed: 'ca21',
      effectiveGasPrice: '0x4a817c800',
      from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
      gasUsed: 'ca21',
      logs: [
        {
          address: '0x9ba60bbf4ba1de43f3b4983a539feebfbd5fd976',
          blockHash:
            '0x243a362e5fda0d6ec8fce3d7f727679148c1df8ec6d7470ff65b38c8a96823b4',
          blockNumber: 'a3d19a',
          data:
            '0x0000000000000000000000000000000000000000000000000000000000003a98',
          logIndex: '0',
          removed: false,
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0x000000000000000000000000ac9539a7d5c43940af498008a7c8f3abb35c3725',
            '0x0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c970',
          ],
          transactionHash:
            '0x3a8ed11c3d0ac26e4fe07812a29efdb642f15b8d83d2716ddf80d11b2542916f',
          transactionIndex: '0',
        },
      ],
      logsBloom:
        '0x00000000000000000000000000000000000000000000001000000100000100000000000000000000000000000000000000000000000000000000000000000000000000000020000000000008000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000100000000000000000000000000000000000000000000000000000000000000000000000800000004000000000000001000000000000000',
      status: '0x1',
      to: '0xefg60bbf4ba1de43f3b4983a539feebfbd5fd976',
      transactionHash:
        '0x3a8ed11c3d0ac26e4fe07812a29efdb642f15b8d83d2716ddf80d11b2542916f',
      transactionIndex: '0',
      type: '0x2',
    },
    baseFeePerGas: '0x14',
    blockTimestamp: '628dc0c8',
  },
  [MOCK_TX_TYPE.TOKEN_METHOD_TRANSFER_FROM]: {
    id: 5177046356058754,
    time: 1653457323504,
    status: 'confirmed',
    chainId: '0x5',
    originalGasEstimate: '0x10896',
    userEditedGasLimit: false,
    chainId: '0x5',
    loadingDefaults: false,
    dappSuggestedGasFees: null,
    sendFlowHistory: [
      {
        entry: 'sendFlow - user set asset type to NFT',
        timestamp: 1653457317999,
      },
      {
        entry: 'sendFlow - user set asset symbol to undefined',
        timestamp: 1653457318000,
      },
      {
        entry:
          'sendFlow - user set asset address to 0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b',
        timestamp: 1653457318000,
      },
      {
        entry:
          'sendFlow - user selected transfer to my accounts on recipient screen',
        timestamp: 1653457319474,
      },
      {
        entry:
          'sendFlow - User clicked recipient from my accounts. address: 0xe56e7847fd3661a9b7c86aaf1daea08d9da5750e, nickname Account 1',
        timestamp: 1653457320321,
      },
    ],
    txParams: {
      from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
      to: '0xefge760f2e916647fd766b4ad9e85ff943ce3a2b',
      nonce: '0x6',
      value: '0x0',
      data:
        '0x23b872dd000000000000000000000000ac9539a7d5c43940af498008a7c8f3abb35c3725000000000000000000000000e56e7847fd3661a9b7c86aaf1daea08d9da5750e000000000000000000000000000000000000000000000000000000000009a7b8',
      gas: '0x10896',
      maxFeePerGas: '0x59682f12',
      maxPriorityFeePerGas: '0x59682f00',
      type: '0x2',
    },
    origin: 'metamask',
    type: 'transferfrom',
    history: [
      {
        id: 5177046356058754,
        time: 1653457323504,
        status: 'unapproved',
        chainId: '0x5',
        originalGasEstimate: '0x10896',
        userEditedGasLimit: false,
        chainId: '0x5',
        loadingDefaults: true,
        dappSuggestedGasFees: null,
        sendFlowHistory: [
          {
            entry: 'sendFlow - user set asset type to NFT',
            timestamp: 1653457317999,
          },
          {
            entry: 'sendFlow - user set asset symbol to undefined',
            timestamp: 1653457318000,
          },
          {
            entry:
              'sendFlow - user set asset address to 0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b',
            timestamp: 1653457318000,
          },
          {
            entry:
              'sendFlow - user selected transfer to my accounts on recipient screen',
            timestamp: 1653457319474,
          },
          {
            entry:
              'sendFlow - User clicked recipient from my accounts. address: 0xe56e7847fd3661a9b7c86aaf1daea08d9da5750e, nickname Account 1',
            timestamp: 1653457320321,
          },
        ],
        txParams: {
          from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
          to: '0xefge760f2e916647fd766b4ad9e85ff943ce3a2b',
          value: '0x0',
          data:
            '0x23b872dd000000000000000000000000ac9539a7d5c43940af498008a7c8f3abb35c3725000000000000000000000000e56e7847fd3661a9b7c86aaf1daea08d9da5750e000000000000000000000000000000000000000000000000000000000009a7b8',
          gas: '0x10896',
          maxFeePerGas: '0x59682f12',
          maxPriorityFeePerGas: '0x59682f00',
          type: '0x2',
        },
        origin: 'metamask',
        type: 'transferfrom',
      },
      [
        {
          op: 'replace',
          path: '/loadingDefaults',
          value: false,
          note: 'Added new unapproved transaction.',
          timestamp: 1653457323593,
        },
        {
          op: 'add',
          path: '/userFeeLevel',
          value: 'medium',
        },
        {
          op: 'add',
          path: '/defaultGasEstimates',
          value: {
            estimateType: 'medium',
            gas: '0x10896',
            maxFeePerGas: '0x59682f12',
            maxPriorityFeePerGas: '0x59682f00',
          },
        },
      ],
      [
        {
          op: 'add',
          path: '/estimatedBaseFee',
          value: 'd',
          note: 'confTx: user approved transaction',
          timestamp: 1653457330346,
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'approved',
          note: 'txStateManager: setting status to approved',
          timestamp: 1653457330347,
        },
      ],
      [
        {
          op: 'add',
          path: '/txParams/nonce',
          value: '0x6',
          note: 'transactions#approveTransaction',
          timestamp: 1653457330354,
        },
      ],
      [
        {
          op: 'add',
          path: '/r',
          value:
            '0x58294750acbe46cb0dd15ef615a244be49af61f0d799cce68bbbd3d4e7c75cdc',
          note: 'transactions#signTransaction: add r, s, v values',
          timestamp: 1653457330496,
        },
        {
          op: 'add',
          path: '/s',
          value:
            '0x3993c38f6e168065d9b20a0b4254697d47db114f57243f56c22f228c7a173f9c',
        },
        {
          op: 'add',
          path: '/v',
          value: '0x01',
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'signed',
          note: 'txStateManager: setting status to signed',
          timestamp: 1653457330497,
        },
      ],
      [
        {
          op: 'add',
          path: '/rawTx',
          value:
            '0x02f8d004068459682f008459682f128301089694f5de760f2e916647fd766b4ad9e85ff943ce3a2b80b86423b872dd000000000000000000000000ac9539a7d5c43940af498008a7c8f3abb35c3725000000000000000000000000e56e7847fd3661a9b7c86aaf1daea08d9da5750e000000000000000000000000000000000000000000000000000000000009a7b8c001a058294750acbe46cb0dd15ef615a244be49af61f0d799cce68bbbd3d4e7c75cdca03993c38f6e168065d9b20a0b4254697d47db114f57243f56c22f228c7a173f9c',
          note: 'transactions#publishTransaction',
          timestamp: 1653457330498,
        },
      ],
      [
        {
          op: 'add',
          path: '/hash',
          value:
            '0xc523e40d676563619138c310391000f91a93005028eedb72bf05133f2d6c8e4d',
          note: 'transactions#setTxHash',
          timestamp: 1653457330596,
        },
      ],
      [
        {
          op: 'add',
          path: '/submittedTime',
          value: 1653457330597,
          note: 'txStateManager - add submitted time stamp',
          timestamp: 1653457330597,
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'submitted',
          note: 'txStateManager: setting status to submitted',
          timestamp: 1653457330598,
        },
      ],
      [
        {
          op: 'replace',
          path: '/status',
          value: 'confirmed',
          note: 'txStateManager: setting status to confirmed',
          timestamp: 1653457338358,
        },
        {
          op: 'add',
          path: '/txReceipt',
          value: {
            blockHash:
              '0x9e97839be24b9dacd2b91a0504317bc9c6eaea6904472dce450e583c398cb60a',
            blockNumber: 'a3d1aa',
            contractAddress: null,
            cumulativeGasUsed: '3c0267',
            effectiveGasPrice: '0x59682f0d',
            from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
            gasUsed: '9da4',
            logs: [
              {
                address: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
                blockHash:
                  '0x9e97839be24b9dacd2b91a0504317bc9c6eaea6904472dce450e583c398cb60a',
                blockNumber: 'a3d1aa',
                data: '0x',
                logIndex: '21',
                removed: false,
                topics: [
                  '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
                  '0x000000000000000000000000ac9539a7d5c43940af498008a7c8f3abb35c3725',
                  '0x0000000000000000000000000000000000000000000000000000000000000000',
                  '0x000000000000000000000000000000000000000000000000000000000009a7b8',
                ],
                transactionHash:
                  '0xc523e40d676563619138c310391000f91a93005028eedb72bf05133f2d6c8e4d',
                transactionIndex: '11',
              },
              {
                address: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
                blockHash:
                  '0x9e97839be24b9dacd2b91a0504317bc9c6eaea6904472dce450e583c398cb60a',
                blockNumber: 'a3d1aa',
                data: '0x',
                logIndex: '22',
                removed: false,
                topics: [
                  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                  '0x000000000000000000000000ac9539a7d5c43940af498008a7c8f3abb35c3725',
                  '0x000000000000000000000000e56e7847fd3661a9b7c86aaf1daea08d9da5750e',
                  '0x000000000000000000000000000000000000000000000000000000000009a7b8',
                ],
                transactionHash:
                  '0xc523e40d676563619138c310391000f91a93005028eedb72bf05133f2d6c8e4d',
                transactionIndex: '11',
              },
            ],
            logsBloom:
              '0x00000000000000000000000000000000000000008000000000000000000100000000000000000000000000000000000000000000000000000000008000200000000000000000000000000008000000000000000000008000000000000000000000000000020000000000000000000800000000000000000000000010000000000000000000000000000000000010000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000002504000000100000000000020000000000000000000000000000020000010000000000000000000000400000000000000000000001000000000000000',
            status: '0x1',
            to: '0xefge760f2e916647fd766b4ad9e85ff943ce3a2b',
            transactionHash:
              '0xc523e40d676563619138c310391000f91a93005028eedb72bf05133f2d6c8e4d',
            transactionIndex: '11',
            type: '0x2',
          },
        },
        {
          op: 'add',
          path: '/baseFeePerGas',
          value: '0xd',
        },
        {
          op: 'add',
          path: '/blockTimestamp',
          value: '628dc1b8',
        },
      ],
      [
        {
          op: 'replace',
          path: '/blockTimestamp',
          value: '628dc1b8',
          note: 'transactions#confirmTransaction - add txReceipt',
          timestamp: 1653457338377,
        },
        {
          op: 'replace',
          path: '/txReceipt/transactionIndex',
          value: '11',
        },
        {
          op: 'replace',
          path: '/txReceipt/logs/1/transactionIndex',
          value: '11',
        },
        {
          op: 'replace',
          path: '/txReceipt/logs/1/logIndex',
          value: '22',
        },
        {
          op: 'replace',
          path: '/txReceipt/logs/1/blockNumber',
          value: 'a3d1aa',
        },
        {
          op: 'replace',
          path: '/txReceipt/logs/0/transactionIndex',
          value: '11',
        },
        {
          op: 'replace',
          path: '/txReceipt/logs/0/logIndex',
          value: '21',
        },
        {
          op: 'replace',
          path: '/txReceipt/logs/0/blockNumber',
          value: 'a3d1aa',
        },
        {
          op: 'replace',
          path: '/txReceipt/cumulativeGasUsed',
          value: '3c0267',
        },
        {
          op: 'replace',
          path: '/txReceipt/blockNumber',
          value: 'a3d1aa',
        },
      ],
    ],
    userFeeLevel: 'medium',
    defaultGasEstimates: {
      estimateType: 'medium',
      gas: '0x10896',
      maxFeePerGas: '0x59682f12',
      maxPriorityFeePerGas: '0x59682f00',
    },
    estimatedBaseFee: 'd',
    r: '0x58294750acbe46cb0dd15ef615a244be49af61f0d799cce68bbbd3d4e7c75cdc',
    s: '0x3993c38f6e168065d9b20a0b4254697d47db114f57243f56c22f228c7a173f9c',
    v: '0x01',
    rawTx:
      '0x02f8d004068459682f008459682f128301089694f5de760f2e916647fd766b4ad9e85ff943ce3a2b80b86423b872dd000000000000000000000000ac9539a7d5c43940af498008a7c8f3abb35c3725000000000000000000000000e56e7847fd3661a9b7c86aaf1daea08d9da5750e000000000000000000000000000000000000000000000000000000000009a7b8c001a058294750acbe46cb0dd15ef615a244be49af61f0d799cce68bbbd3d4e7c75cdca03993c38f6e168065d9b20a0b4254697d47db114f57243f56c22f228c7a173f9c',
    hash: '0xc523e40d676563619138c310391000f91a93005028eedb72bf05133f2d6c8e4d',
    submittedTime: 1653457330597,
    txReceipt: {
      blockHash:
        '0x9e97839be24b9dacd2b91a0504317bc9c6eaea6904472dce450e583c398cb60a',
      blockNumber: 'a3d1aa',
      contractAddress: null,
      cumulativeGasUsed: '3c0267',
      effectiveGasPrice: '0x59682f0d',
      from: '0xabc539a7d5c43940af498008a7c8f3abb35c3725',
      gasUsed: '9da4',
      logs: [
        {
          address: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
          blockHash:
            '0x9e97839be24b9dacd2b91a0504317bc9c6eaea6904472dce450e583c398cb60a',
          blockNumber: 'a3d1aa',
          data: '0x',
          logIndex: '21',
          removed: false,
          topics: [
            '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
            '0x000000000000000000000000ac9539a7d5c43940af498008a7c8f3abb35c3725',
            '0x0000000000000000000000000000000000000000000000000000000000000000',
            '0x000000000000000000000000000000000000000000000000000000000009a7b8',
          ],
          transactionHash:
            '0xc523e40d676563619138c310391000f91a93005028eedb72bf05133f2d6c8e4d',
          transactionIndex: '11',
        },
        {
          address: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
          blockHash:
            '0x9e97839be24b9dacd2b91a0504317bc9c6eaea6904472dce450e583c398cb60a',
          blockNumber: 'a3d1aa',
          data: '0x',
          logIndex: '22',
          removed: false,
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0x000000000000000000000000ac9539a7d5c43940af498008a7c8f3abb35c3725',
            '0x000000000000000000000000e56e7847fd3661a9b7c86aaf1daea08d9da5750e',
            '0x000000000000000000000000000000000000000000000000000000000009a7b8',
          ],
          transactionHash:
            '0xc523e40d676563619138c310391000f91a93005028eedb72bf05133f2d6c8e4d',
          transactionIndex: '11',
        },
      ],
      logsBloom:
        '0x00000000000000000000000000000000000000008000000000000000000100000000000000000000000000000000000000000000000000000000008000200000000000000000000000000008000000000000000000008000000000000000000000000000020000000000000000000800000000000000000000000010000000000000000000000000000000000010000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000002504000000100000000000020000000000000000000000000000020000010000000000000000000000400000000000000000000001000000000000000',
      status: '0x1',
      to: '0xefge760f2e916647fd766b4ad9e85ff943ce3a2b',
      transactionHash:
        '0xc523e40d676563619138c310391000f91a93005028eedb72bf05133f2d6c8e4d',
      transactionIndex: '11',
      type: '0x2',
    },
    baseFeePerGas: '0xd',
    blockTimestamp: '628dc1b8',
  },
};
