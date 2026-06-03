import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { CHAIN_IDS } from '../../../constants/network';
import { toAssetId } from '../../asset-utils';
import { mapApiEvmTransactions } from './api-evm-transactions';

const subjectAddress = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
const baseUsdc = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const baseAaveUsdc = '0x4e65fe4dba92790696d040ac24aa414708f5c0ab';
const baseAavePool = '0xa238dd80c259a72e81d7e4664a9801593f98d1c5';
const baseRecipientAddress = '0x6fdb1e9d93c1279177b00baaf44524055455e92e';
const lineaMusd = '0xaca92e438df0b2401ff60da7e4337b687a2435da';
const lineaSenderAddress = '0xf70da97812cb96acdf810712aa562db8dfa3dbef';
const exchangeRecipient = '0x3913a8aca88c946284abbe7ab2ed671c6603de20';
const metamaskBonusContract = '0x3ef3d8ba38ebe18db133cec108f4d14ce00dd9ae';
const bscContractCallerAddress = '0xf70da97812cb96acdf810712aa562db8dfa3dbef';
const bscUniversalRouter = '0xca11bde05977b3631167028862be2a173976ca11';
const bscRecipientAddress = '0xb92fe925dc43a0ecde6c8b1a2709c170ec4fff4f';
const polygonRecipientAddress = '0x2cd071562a1688b3e9f31be39c92aa140a1acc94';
const wethContractAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const zeroAddress = '0x0000000000000000000000000000000000000000';

describe('mapEvmTransactions', () => {
  it('maps an ERC-20 transfer sent by the account to a Send activity', () => {
    const transaction = {
      timestamp: '2026-05-12T13:37:47.000Z',
      chainId: Number(CHAIN_IDS.BASE),
      from: subjectAddress,
      to: baseUsdc,
      transactionCategory: 'TRANSFER',
      valueTransfers: [
        {
          from: subjectAddress,
          to: baseRecipientAddress,
          symbol: 'USDC',
        },
      ],
    } as unknown as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'send',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1778593067000,
      data: {
        from: subjectAddress,
        hash: undefined,
        to: baseRecipientAddress,
        token: {
          direction: 'out',
          symbol: 'USDC',
          assetId: toAssetId(baseUsdc, 'eip155:8453'),
        },
      },
    });
  });

  it('maps a native value contract call without method data to a Send activity', () => {
    const transaction = {
      hash: '0x64d2f26c261178252fcad9dbb665cf40337b827a582066553dd6634eaeea9f0a',
      timestamp: '2026-05-19T19:27:12.000Z',
      chainId: Number(CHAIN_IDS.POLYGON),
      from: subjectAddress,
      to: polygonRecipientAddress,
      methodId: null,
      transactionCategory: 'CONTRACT_CALL',
      transactionType: 'GENERIC_CONTRACT_CALL',
      value: '100000000000000000',
      valueTransfers: [
        {
          from: subjectAddress,
          to: polygonRecipientAddress,
          amount: '100000000000000000',
          decimal: 18,
          symbol: 'MATIC',
          transferType: 'normal',
        },
      ],
    } as unknown as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'send',
      chainId: 'eip155:137',
      status: 'success',
      timestamp: 1779218832000,
      data: {
        from: subjectAddress,
        hash: '0x64d2f26c261178252fcad9dbb665cf40337b827a582066553dd6634eaeea9f0a',
        to: polygonRecipientAddress,
        token: {
          amount: '100000000000000000',
          assetId: 'eip155:137/slip44:966',
          decimals: 18,
          direction: 'out',
          symbol: 'MATIC',
        },
      },
    });
  });

  it('maps an approval without value transfers to an Approve spending cap activity with token metadata', () => {
    const transaction = {
      hash: '0x91f89897197afcc09ad98ec4282366fd7938d8a9609e4fc2a0aa2d070664bc27',
      timestamp: '2026-05-27T13:20:27.000Z',
      chainId: Number(CHAIN_IDS.BASE),
      accountId: `eip155:8453:${subjectAddress}`,
      blockNumber: 46549340,
      blockHash:
        '0xabb0026aa96f71b005cfe09262a870ff1e71b68c1649e58516aa60a67039fc79',
      gas: 38764,
      gasUsed: 33441,
      gasPrice: '33295732',
      effectiveGasPrice: '33295732',
      nonce: 527,
      cumulativeGasUsed: 3704697,
      methodId: '0x095ea7b3',
      value: '0',
      to: baseUsdc,
      from: subjectAddress,
      isError: false,
      valueTransfers: [],
      logs: [],
      transactionProtocol: 'ERC_20',
      transactionCategory: 'APPROVE',
      transactionType: 'ERC_20_APPROVE',
    } as unknown as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'approveSpendingCap',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1779888027000,
      data: {
        hash: '0x91f89897197afcc09ad98ec4282366fd7938d8a9609e4fc2a0aa2d070664bc27',
        token: {
          direction: 'out',
          symbol: 'USDC',
          decimals: 6,
          assetId: toAssetId(baseUsdc, 'eip155:8453'),
        },
      },
    });
  });

  it('maps an ERC-20 transfer received by the account to a Receive activity', () => {
    const transaction = {
      timestamp: '2026-05-05T12:15:27.000Z',
      chainId: Number(CHAIN_IDS.LINEA_MAINNET),
      from: lineaSenderAddress,
      to: lineaMusd,
      transactionCategory: 'TRANSFER',
      valueTransfers: [
        {
          from: lineaSenderAddress,
          to: subjectAddress,
          symbol: 'mUSD',
        },
      ],
    } as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'receive',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1777983327000,
      data: {
        from: lineaSenderAddress,
        hash: undefined,
        to: subjectAddress,
        token: {
          direction: 'in',
          symbol: 'mUSD',
          assetId: toAssetId(lineaMusd, 'eip155:59144'),
        },
      },
    });
  });

  it('maps an exchange transaction without a received token to an incomplete Swap activity', () => {
    const transaction = {
      timestamp: '2026-05-05T17:57:53.000Z',
      chainId: Number(CHAIN_IDS.LINEA_MAINNET),
      from: subjectAddress,
      to: subjectAddress,
      transactionCategory: 'EXCHANGE',
      valueTransfers: [
        {
          from: subjectAddress,
          to: exchangeRecipient,
          symbol: 'mUSD',
        },
      ],
    } as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'swapIncomplete',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1778003873000,
      data: {
        hash: undefined,
        sourceToken: {
          direction: 'out',
          symbol: 'mUSD',
        },
      },
    });
  });

  it('maps an exchange transaction with an internal ETH receive transfer to a Swap activity with native destination assetId', () => {
    const aggregatorAddress = '0x0a2854fbbd9b3ef66f17d47284e7f899b9509330';
    const transaction = {
      hash: '0x80b974d5834e1047a78332369de3d4b988f0237ff8a418c9464217e55c542f2f',
      timestamp: '2026-05-28T01:03:49.000Z',
      chainId: Number(CHAIN_IDS.LINEA_MAINNET),
      accountId: `eip155:59144:${subjectAddress}`,
      methodId: '0xe9ae5c53',
      value: '0',
      to: subjectAddress,
      from: subjectAddress,
      isError: false,
      transactionCategory: 'EXCHANGE',
      valueTransfers: [
        {
          from: aggregatorAddress,
          to: subjectAddress,
          amount: '4894004361763',
          decimal: 18,
          symbol: 'ETH',
          name: 'Ether',
          transferType: 'internal',
        },
        {
          from: subjectAddress,
          to: aggregatorAddress,
          amount: '10000',
          decimal: 6,
          contractAddress: lineaMusd,
          symbol: 'mUSD',
          name: 'MetaMask USD',
          transferType: 'erc20',
        },
      ],
      logs: [],
    } as unknown as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'swap',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1779930229000,
      data: {
        hash: '0x80b974d5834e1047a78332369de3d4b988f0237ff8a418c9464217e55c542f2f',
        sourceToken: {
          amount: '10000',
          decimals: 6,
          direction: 'out',
          assetId: toAssetId(lineaMusd, 'eip155:59144'),
          symbol: 'mUSD',
        },
        destinationToken: {
          amount: '4894004361763',
          decimals: 18,
          direction: 'in',
          assetId: toAssetId(
            '0x0000000000000000000000000000000000000000',
            'eip155:59144',
          ),
          symbol: 'ETH',
        },
      },
    });
  });

  it('maps an NFT sale with received native value to a Send activity', () => {
    const nftRecipientAddress = '0x4f5243ceea96cee1da0fdb89c756d0e999439424';
    const nftBuyerAddress = '0x78c87da124bb36a914ff1c0f2d642f47870c997c';
    const transaction = {
      timestamp: '2026-02-23T22:04:23.000Z',
      chainId: Number(CHAIN_IDS.MAINNET),
      from: nftBuyerAddress,
      to: subjectAddress,
      transactionCategory: 'TRANSFER',
      valueTransfers: [
        {
          from: subjectAddress,
          to: nftRecipientAddress,
          amount: 1,
          tokenId: '984',
          symbol: 'BAE',
          transferType: 'erc1155',
        },
        {
          from: nftBuyerAddress,
          to: subjectAddress,
          amount: '1000000000000000',
          decimal: 18,
          symbol: 'ETH',
          transferType: 'normal',
        },
      ],
    } as unknown as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1771884263000,
      data: {
        from: subjectAddress,
        hash: undefined,
        to: nftRecipientAddress,
        token: {
          amount: '1',
          direction: 'out',
          symbol: 'BAE',
        },
      },
    });
  });

  it('maps an NFT mint transfer to an nftMint activity without assetId', () => {
    const nftContractAddress = '0x239fd4b0c4db49fa8660e65b97619d43d0e0a79d';
    const transaction = {
      hash: '0x25805d4ae16935e6fa92add9dcee97db0127749d4244032a79489098a880210c',
      timestamp: '2026-05-13T14:34:23.000Z',
      chainId: Number(CHAIN_IDS.LINEA_MAINNET),
      from: zeroAddress,
      to: subjectAddress,
      transactionCategory: 'TRANSFER',
      valueTransfers: [
        {
          from: zeroAddress,
          to: subjectAddress,
          contractAddress: nftContractAddress,
          tokenId: '1',
          symbol: 'TDN',
          transferType: 'erc721',
        },
      ],
    } as unknown as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'nftMint',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1778682863000,
      data: {
        hash: '0x25805d4ae16935e6fa92add9dcee97db0127749d4244032a79489098a880210c',
        from: zeroAddress,
        to: subjectAddress,
        token: {
          direction: 'in',
          symbol: 'TDN',
        },
      },
    });
  });

  it('maps an Aave supply contract call to a Lending deposit activity', () => {
    const transaction = {
      hash: '0x08d14578168f22001e95503469c63613bd9f3d3f60e81dbbf204fbd21f484bd9',
      timestamp: '2026-05-13T03:31:29.000Z',
      chainId: Number(CHAIN_IDS.BASE),
      from: subjectAddress,
      to: baseAavePool,
      methodId: '0x617ba037',
      transactionCategory: 'CONTRACT_CALL',
      transactionType: 'GENERIC_CONTRACT_CALL',
      valueTransfers: [
        {
          from: '0x0000000000000000000000000000000000000000',
          to: subjectAddress,
          amount: '99999',
          decimal: 6,
          contractAddress: baseAaveUsdc,
          symbol: 'aBasUSDC',
        },
        {
          from: subjectAddress,
          to: baseAaveUsdc,
          amount: '100000',
          decimal: 6,
          contractAddress: baseUsdc,
          symbol: 'USDC',
        },
      ],
    } as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'lendingDeposit',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1778643089000,
      data: {
        hash: '0x08d14578168f22001e95503469c63613bd9f3d3f60e81dbbf204fbd21f484bd9',
        sourceToken: {
          amount: '100000',
          decimals: 6,
          direction: 'out',
          symbol: 'USDC',
          assetId: toAssetId(baseUsdc, 'eip155:8453'),
        },
        destinationToken: {
          amount: '99999',
          decimals: 6,
          direction: 'in',
          symbol: 'aBasUSDC',
          assetId: toAssetId(baseAaveUsdc, 'eip155:8453'),
        },
      },
    });
  });

  it('maps a DEPOSIT without an inbound transfer to a deposit activity', () => {
    const stakingContractAddress = '0x00000000219ab540356cbb839cbe05303d7705fa';
    const transaction = {
      hash: '0xabc123deposit00000000000000000000000000000000000000000000000001',
      timestamp: '2026-05-12T13:37:47.000Z',
      chainId: Number(CHAIN_IDS.MAINNET),
      from: subjectAddress,
      to: stakingContractAddress,
      transactionCategory: 'DEPOSIT',
      valueTransfers: [
        {
          from: subjectAddress,
          to: stakingContractAddress,
          amount: '1000000000000000000',
          decimal: 18,
          symbol: 'ETH',
          transferType: 'normal',
        },
      ],
    } as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'deposit',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1778593067000,
      data: {
        hash: '0xabc123deposit00000000000000000000000000000000000000000000000001',
        token: {
          amount: '1000000000000000000',
          decimals: 18,
          direction: 'in',
          symbol: 'ETH',
          assetId: toAssetId(
            '0x0000000000000000000000000000000000000000',
            'eip155:1',
          ),
        },
      },
    });
  });

  it('maps a WETH deposit to a Wrap activity', () => {
    const transaction = {
      hash: '0x6e448f5b8cf55534507770c1cb90ba14e723d03b4a46b4919a5847eb8d13b7b5',
      timestamp: '2026-05-28T13:42:23.000Z',
      chainId: Number(CHAIN_IDS.MAINNET),
      from: subjectAddress,
      to: wethContractAddress,
      methodId: '0xd0e30db0',
      transactionCategory: 'DEPOSIT',
      transactionProtocol: 'WETH',
      transactionType: 'WETH_DEPOSIT',
      valueTransfers: [
        {
          from: '0x0000000000000000000000000000000000000000',
          to: subjectAddress,
          amount: '1000000000000',
          decimal: 18,
          contractAddress: wethContractAddress,
          symbol: 'WETH',
          transferType: 'erc20',
        },
        {
          from: subjectAddress,
          to: wethContractAddress,
          amount: '1000000000000',
          decimal: 18,
          symbol: 'ETH',
          transferType: 'normal',
        },
      ],
    } as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'wrap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1779975743000,
      data: {
        hash: '0x6e448f5b8cf55534507770c1cb90ba14e723d03b4a46b4919a5847eb8d13b7b5',
        sourceToken: {
          amount: '1000000000000',
          decimals: 18,
          direction: 'out',
          symbol: 'ETH',
          assetId: toAssetId(
            '0x0000000000000000000000000000000000000000',
            'eip155:1',
          ),
        },
        destinationToken: {
          amount: '1000000000000',
          decimals: 18,
          direction: 'in',
          symbol: 'WETH',
          assetId: toAssetId(wethContractAddress, 'eip155:1'),
        },
      },
    });
  });

  it('maps a WETH withdrawal to an Unwrap activity', () => {
    const transaction = {
      hash: '0x8f2a1c9e4b7d30651234567890abcdef1234567890abcdef1234567890abcdef',
      timestamp: '2026-05-28T14:15:00.000Z',
      chainId: Number(CHAIN_IDS.MAINNET),
      from: subjectAddress,
      to: wethContractAddress,
      methodId: '0x2e1a7d4d',
      transactionCategory: 'UNWRAP',
      transactionProtocol: 'WETH',
      transactionType: 'WETH_WITHDRAW',
      valueTransfers: [
        {
          from: subjectAddress,
          to: wethContractAddress,
          amount: '1000000000000',
          decimal: 18,
          contractAddress: wethContractAddress,
          symbol: 'WETH',
          transferType: 'erc20',
        },
        {
          from: wethContractAddress,
          to: subjectAddress,
          amount: '1000000000000',
          decimal: 18,
          symbol: 'ETH',
          transferType: 'normal',
        },
      ],
    } as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'unwrap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1779977700000,
      data: {
        hash: '0x8f2a1c9e4b7d30651234567890abcdef1234567890abcdef1234567890abcdef',
        sourceToken: {
          amount: '1000000000000',
          decimals: 18,
          direction: 'out',
          symbol: 'WETH',
          assetId: toAssetId(wethContractAddress, 'eip155:1'),
        },
        destinationToken: {
          amount: '1000000000000',
          decimals: 18,
          direction: 'in',
          symbol: 'ETH',
          assetId: toAssetId(
            '0x0000000000000000000000000000000000000000',
            'eip155:1',
          ),
        },
      },
    });
  });

  it('maps a MetaMask mUSD bonus claim to a Claim mUSD bonus activity', () => {
    const transaction = {
      hash: '0x875ded271a40278391fca5d71892231afd0cb9592f31bdf3b7c949906cb982c4',
      timestamp: '2026-05-13T00:48:45.000Z',
      chainId: Number(CHAIN_IDS.LINEA_MAINNET),
      from: subjectAddress,
      to: metamaskBonusContract,
      transactionCategory: 'CLAIM_BONUS',
      valueTransfers: [
        {
          from: metamaskBonusContract,
          to: subjectAddress,
          contractAddress: lineaMusd,
          symbol: 'mUSD',
        },
      ],
    } as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'claimMusdBonus',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1778633325000,
      data: {
        hash: '0x875ded271a40278391fca5d71892231afd0cb9592f31bdf3b7c949906cb982c4',
        token: {
          direction: 'in',
          symbol: 'mUSD',
          assetId: toAssetId(lineaMusd, 'eip155:59144'),
        },
      },
    });
  });

  it('maps a bridge withdraw to a Bridge activity', () => {
    const transaction = {
      hash: '0x9f81163d00374094411f44732738c6dea194551e4500bde9fd7ee60319aac766',
      timestamp: '2026-05-28T04:13:31.000Z',
      chainId: 8453,
      accountId: 'eip155:8453:0x9bed78535d6a03a955f1504aadba974d9a29e292',
      blockNumber: 46576132,
      blockHash:
        '0x0c591fa154c6e1f2afdef55a5da25a49173b1a6126e6a98a90ec86c5e9952843',
      gas: 277734,
      gasUsed: 151663,
      gasPrice: '29184149',
      effectiveGasPrice: '29184149',
      nonce: 530,
      cumulativeGasUsed: 15490950,
      methodId: '0xe9ae5c53',
      value: '0',
      to: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
      from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
      isError: false,
      valueTransfers: [
        {
          from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
          to: '0xa5c1ce365ddb5a91ff466774ec4bdf8f97cb9f55',
          amount: '100000',
          decimal: 6,
          contractAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          symbol: 'USDC',
          name: 'USD Coin',
          transferType: 'erc20',
        },
      ],
      logs: [],
      transactionCategory: 'BRIDGE_WITHDRAW',
      transactionProtocol: 'ACROSS',
      transactionType: 'ACROSS_BRIDGE_WITHDRAW',
      readable: 'Withdrew',
      readableExtended: 'Withdrew',
    } as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'bridge',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1779941611000,
      data: {
        hash: '0x9f81163d00374094411f44732738c6dea194551e4500bde9fd7ee60319aac766',
        sourceToken: {
          amount: '100000',
          decimals: 6,
          direction: 'out',
          symbol: 'USDC',
          assetId: toAssetId(baseUsdc, 'eip155:8453'),
        },
      },
    });
  });

  it('maps an unrecognized transaction category to a contract interaction activity', () => {
    const transaction = {
      timestamp: '2026-05-12T16:04:40.000Z',
      chainId: Number(CHAIN_IDS.BSC),
      from: bscContractCallerAddress,
      to: bscUniversalRouter,
      methodId: '0x174dea71',
      transactionCategory: 'CONTRACT_CALL',
      transactionProtocol: 'GENERIC',
      transactionType: 'GENERIC_CONTRACT_CALL',
      valueTransfers: [
        {
          from: subjectAddress,
          to: bscRecipientAddress,
          symbol: 'BNB',
        },
      ],
    } as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
    const activity = { ...item };
    delete activity.raw;

    expect(activity).toStrictEqual({
      type: 'contractInteraction',
      chainId: 'eip155:56',
      status: 'success',
      timestamp: 1778601880000,
      data: {
        from: bscContractCallerAddress,
        hash: undefined,
        methodId: '0x174dea71',
        to: bscUniversalRouter,
        transactionCategory: 'CONTRACT_CALL',
        transactionProtocol: 'GENERIC',
        transactionType: 'GENERIC_CONTRACT_CALL',
      },
    });
  });
});
