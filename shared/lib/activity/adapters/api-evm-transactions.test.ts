import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { CHAIN_IDS } from '../../../constants/network';
import { toAssetId } from '../../asset-utils';
import { mapApiEvmTransactions } from './api-evm-transactions';
import { apiResponses } from './fixtures/api-responses';

const subjectAddress = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
const baseUsdc = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const mainnetUsdc = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
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

    expect(item).toMatchObject({
      type: 'send',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1778593067000,
      data: {
        from: subjectAddress,
        to: baseRecipientAddress,
        token: {
          direction: 'out',
          symbol: 'USDC',
          assetId: toAssetId(baseUsdc, 'eip155:8453'),
        },
      },
    });
  });

  it('maps an ERC-20 transfer with an incidental receive transfer to a Send activity', () => {
    const transaction =
      apiResponses.lineaAaveUsdcSendWithRebaseCredit as unknown as V1TransactionByHashResponse;
    const aaveLineaUsdc = transaction.to;
    const senderAddress = transaction.from;
    const recipientAddress = transaction.valueTransfers?.[1]?.to;

    const item = mapApiEvmTransactions({
      subjectAddress: senderAddress,
      transaction,
    });

    expect(item).toMatchObject({
      type: 'send',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1778074371000,
      hash: transaction.hash,
      data: {
        from: senderAddress,
        to: recipientAddress,
        token: {
          direction: 'out',
          amount: '419402',
          decimals: 6,
          symbol: 'aLinUSDC',
          assetId: toAssetId(aaveLineaUsdc, 'eip155:59144'),
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

    expect(item).toMatchObject({
      type: 'send',
      chainId: 'eip155:137',
      status: 'success',
      timestamp: 1779218832000,
      hash: '0x64d2f26c261178252fcad9dbb665cf40337b827a582066553dd6634eaeea9f0a',
      data: {
        from: subjectAddress,
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

    expect(item).toMatchObject({
      type: 'approveSpendingCap',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1779888027000,
      hash: '0x91f89897197afcc09ad98ec4282366fd7938d8a9609e4fc2a0aa2d070664bc27',
      data: {
        token: {
          direction: 'out',
          symbol: 'USDC',
          decimals: 6,
          assetId: toAssetId(baseUsdc, 'eip155:8453'),
        },
      },
    });
  });

  it('falls back to value transfer contract address when approval to is invalid', () => {
    const transaction = {
      hash: '0x91f89897197afcc09ad98ec4282366fd7938d8a9609e4fc2a0aa2d070664bc27',
      timestamp: '2026-05-27T13:20:27.000Z',
      chainId: Number(CHAIN_IDS.LINEA_MAINNET),
      methodId: '0x095ea7b3',
      value: '0',
      to: '0x23',
      from: subjectAddress,
      isError: false,
      valueTransfers: [
        {
          contractAddress: lineaMusd,
          symbol: 'mUSD',
          decimal: 18,
          transferType: 'erc20',
        },
      ],
      transactionCategory: 'APPROVE',
      transactionType: 'ERC_20_APPROVE',
    } as unknown as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });

    expect(item).toMatchObject({
      type: 'approveSpendingCap',
      chainId: 'eip155:59144',
      data: {
        token: {
          direction: 'out',
          symbol: 'mUSD',
          assetId: toAssetId(lineaMusd, 'eip155:59144'),
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

    expect(item).toMatchObject({
      type: 'receive',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1777983327000,
      data: {
        from: lineaSenderAddress,
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

    expect(item).toMatchObject({
      type: 'swapIncomplete',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1778003873000,
      data: {
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

    expect(item).toMatchObject({
      type: 'swap',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1779930229000,
      hash: '0x80b974d5834e1047a78332369de3d4b988f0237ff8a418c9464217e55c542f2f',
      data: {
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

  it('maps the LiFi Linea USDC to ETH exchange to a Swap activity', () => {
    const transaction =
      apiResponses.lifiLineaUsdcEthExchange as unknown as V1TransactionByHashResponse;
    const swapperAddress = transaction.from;
    const lineaUsdc = '0x176211869ca2b568f2a7d4ee941e073a821ee1ff';

    const item = mapApiEvmTransactions({
      subjectAddress: swapperAddress,
      transaction,
    });

    expect(item).toMatchObject({
      type: 'swap',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: new Date('2026-01-16T21:09:00.000Z').getTime(),
      hash: '0x3ac43e7c4a1a4421304ada43b41acec4d71ad90abfa418e97e92540a26eef0a2',
      data: {
        sourceToken: {
          amount: '7934205',
          decimals: 6,
          direction: 'out',
          assetId: toAssetId(lineaUsdc, 'eip155:59144'),
          symbol: 'USDC',
        },
        destinationToken: {
          amount: '2388594176642019',
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

  it('maps an NFT sale with received native ETH to a Sell activity', () => {
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

    expect(item).toMatchObject({
      type: 'nftSell',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1771884263000,
      data: {
        from: subjectAddress,
        to: nftRecipientAddress,
        token: {
          direction: 'out',
          symbol: 'BAE',
        },
        paymentToken: {
          direction: 'in',
          symbol: 'ETH',
        },
      },
    });
  });

  it('maps an OpenSea NFT sale paid in WETH to a Sell activity', () => {
    const sellerAddress = '0xe321bd63cde8ea046b382f82964575f2a5586474';

    const item = mapApiEvmTransactions({
      subjectAddress: sellerAddress,
      transaction:
        apiResponses.openseaNftSaleWeth as unknown as V1TransactionByHashResponse,
    });

    expect(item).toMatchObject({
      type: 'nftSell',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1768427429000,
      hash: '0x0e7f29fa4af73f3708a7383a2fa8d0e09f6c6bf8a176bccf3a6b3259e2886bae',
      data: {
        from: sellerAddress,
        to: '0xbaf3ad6542f932cc0e0b54983e82e0cfb7c5a5a1',
        token: {
          direction: 'out',
          // name takes precedence over symbol for NFTs
          symbol: 'The Warplets',
        },
        paymentToken: {
          direction: 'in',
          symbol: 'WETH',
        },
      },
    });
  });

  it('maps a plain NFT send with no payment to a Send activity', () => {
    const nftRecipientAddress = '0x4f5243ceea96cee1da0fdb89c756d0e999439424';
    const transaction = {
      timestamp: '2026-02-23T22:04:23.000Z',
      chainId: Number(CHAIN_IDS.MAINNET),
      from: subjectAddress,
      to: nftRecipientAddress,
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
      ],
    } as unknown as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });

    expect(item).toMatchObject({
      type: 'send',
      chainId: 'eip155:1',
      data: {
        token: {
          direction: 'out',
          symbol: 'BAE',
        },
      },
    });
  });

  it('maps an NFT purchase', () => {
    const nftBuyerAddress = '0x699e414873f56c7bb60e54ad63d3bb7b283874df';

    const item = mapApiEvmTransactions({
      subjectAddress: nftBuyerAddress,
      transaction:
        apiResponses.nftPurchaseErc1155 as unknown as V1TransactionByHashResponse,
    });

    expect(item).toMatchObject({
      type: 'nftBuy',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1780601507000,
      hash: '0x8719dadd883779624845106e61fd94af234411c30d73184a72f4daf1425c4595',
      data: {
        from: '0x107b2e855528f344556f8c766a6187326a2c2fa6',
        to: nftBuyerAddress,
        token: {
          direction: 'in',
          symbol: 'FLUF World: Scenes and Sounds',
        },
        paymentToken: {
          direction: 'out',
          symbol: 'ETH',
        },
      },
    });
  });

  it('maps an NFT purchase paid in WETH (ERC-20) to an nftBuy activity', () => {
    const nftBuyerAddress = '0x699e414873f56c7bb60e54ad63d3bb7b283874df';
    const nftSellerAddress = '0x107b2e855528f344556f8c766a6187326a2c2fa6';
    const transaction = {
      timestamp: '2026-06-04T19:31:47.000Z',
      chainId: Number(CHAIN_IDS.MAINNET),
      from: nftBuyerAddress,
      to: '0x0000000000000068f116a894984e2db1123eb395',
      transactionCategory: 'CONTRACT_CALL',
      valueTransfers: [
        {
          from: nftSellerAddress,
          to: nftBuyerAddress,
          amount: 1,
          tokenId: '57',
          contractAddress: '0x6fad73936527d2a82aea5384d252462941b44042',
          name: 'FLUF World: Scenes and Sounds',
          transferType: 'erc1155',
        },
        {
          from: nftBuyerAddress,
          to: nftSellerAddress,
          amount: '89992880000000',
          decimal: 18,
          symbol: 'WETH',
          contractAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          transferType: 'erc20',
        },
      ],
    } as unknown as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress: nftBuyerAddress,
      transaction,
    });

    expect(item).toMatchObject({
      type: 'nftBuy',
      data: {
        token: {
          direction: 'in',
          symbol: 'FLUF World: Scenes and Sounds',
        },
        paymentToken: {
          direction: 'out',
          symbol: 'WETH',
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

    expect(item).toMatchObject({
      type: 'nftMint',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1778682863000,
      hash: '0x25805d4ae16935e6fa92add9dcee97db0127749d4244032a79489098a880210c',
      data: {
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

    expect(item).toMatchObject({
      type: 'lendingDeposit',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1778643089000,
      hash: '0x08d14578168f22001e95503469c63613bd9f3d3f60e81dbbf204fbd21f484bd9',
      data: {
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

  it('maps an Aave withdraw with a known method id to a Lending withdrawal activity', () => {
    const transaction = {
      hash: '0x26f4911467b538702c0945e4ec5e303de44c0c1c174897141d1b548ea3161795',
      timestamp: '2026-05-27T14:47:14.000Z',
      chainId: Number(CHAIN_IDS.BASE),
      from: subjectAddress,
      to: baseAavePool,
      methodId: '0x69328dec',
      transactionCategory: 'WITHDRAW',
      transactionType: 'GENERIC_CONTRACT_CALL',
      valueTransfers: [
        {
          from: subjectAddress,
          to: baseAaveUsdc,
          amount: '100000',
          decimal: 6,
          contractAddress: baseAaveUsdc,
          symbol: 'aBasUSDC',
        },
        {
          from: baseAavePool,
          to: subjectAddress,
          amount: '200000',
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

    expect(item).toMatchObject({
      type: 'lendingWithdrawal',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1779893234000,
      hash: '0x26f4911467b538702c0945e4ec5e303de44c0c1c174897141d1b548ea3161795',
      data: {
        sourceToken: {
          amount: '100000',
          decimals: 6,
          direction: 'out',
          symbol: 'aBasUSDC',
          assetId: toAssetId(baseAaveUsdc, 'eip155:8453'),
        },
        destinationToken: {
          amount: '200000',
          decimals: 6,
          direction: 'in',
          symbol: 'USDC',
          assetId: toAssetId(baseUsdc, 'eip155:8453'),
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

    expect(item).toMatchObject({
      type: 'deposit',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1778593067000,
      hash: '0xabc123deposit00000000000000000000000000000000000000000000000001',
      data: {
        token: {
          amount: '1000000000000000000',
          decimals: 18,
          direction: 'out',
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

    expect(item).toMatchObject({
      type: 'wrap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1779975743000,
      hash: '0x6e448f5b8cf55534507770c1cb90ba14e723d03b4a46b4919a5847eb8d13b7b5',
      data: {
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

    expect(item).toMatchObject({
      type: 'unwrap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1779977700000,
      hash: '0x8f2a1c9e4b7d30651234567890abcdef1234567890abcdef1234567890abcdef',
      data: {
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

    expect(item).toMatchObject({
      type: 'claimMusdBonus',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1778633325000,
      hash: '0x875ded271a40278391fca5d71892231afd0cb9592f31bdf3b7c949906cb982c4',
      data: {
        from: subjectAddress,
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

    expect(item).toMatchObject({
      type: 'bridge',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1779941611000,
      hash: '0x9f81163d00374094411f44732738c6dea194551e4500bde9fd7ee60319aac766',
      data: {
        fees: [
          {
            amount: '4426155589787',
            assetId: toAssetId(
              '0x0000000000000000000000000000000000000000',
              'eip155:8453',
            ),
            decimals: 18,
            symbol: 'ETH',
            type: 'base',
          },
        ],
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

    expect(item).toMatchObject({
      type: 'contractInteraction',
      chainId: 'eip155:56',
      status: 'success',
      timestamp: 1778601880000,
      data: {
        from: bscContractCallerAddress,
        methodId: '0x174dea71',
        to: bscUniversalRouter,
        transactionCategory: 'CONTRACT_CALL',
        transactionProtocol: 'GENERIC',
        transactionType: 'GENERIC_CONTRACT_CALL',
      },
    });
  });

  it('maps the reported generic contract call to a contract interaction with its token amount', () => {
    const transaction = {
      hash: '0xd206cc6c16974409bae072ce4cd1559743041af40c2bae84775a0bbb4dff5fee',
      timestamp: '2026-05-01T13:39:47.000Z',
      chainId: Number(CHAIN_IDS.MAINNET),
      from: subjectAddress,
      to: subjectAddress,
      methodId: '0xe9ae5c53',
      value: '0',
      transactionCategory: 'CONTRACT_CALL',
      transactionType: 'GENERIC_CONTRACT_CALL',
      valueTransfers: [
        {
          from: subjectAddress,
          to: '0x4cd00e387622c35bddb9b4c962c136462338bc31',
          amount: '580060',
          decimal: 6,
          contractAddress: mainnetUsdc,
          symbol: 'USDC',
          name: 'USD Coin',
          transferType: 'erc20',
        },
      ],
    } as V1TransactionByHashResponse;

    const item = mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });

    expect(item).toMatchObject({
      type: 'contractInteraction',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1777642787000,
      hash: '0xd206cc6c16974409bae072ce4cd1559743041af40c2bae84775a0bbb4dff5fee',
      data: {
        from: subjectAddress,
        methodId: '0xe9ae5c53',
        to: subjectAddress,
        transactionCategory: 'CONTRACT_CALL',
        transactionProtocol: undefined,
        transactionType: 'GENERIC_CONTRACT_CALL',
        token: {
          amount: '580060',
          assetId: toAssetId(mainnetUsdc, 'eip155:1'),
          decimals: 6,
          direction: 'out',
          symbol: 'USDC',
        },
      },
    });
  });

  it('maps a Standard transaction on a chain outside the swaps registry without throwing', () => {
    // chainId 4657 (0x1231) is not in the bridge swaps registry, so the native
    // asset lookup throws; mapping should degrade gracefully instead.
    const transaction = {
      timestamp: '2026-05-12T13:37:47.000Z',
      chainId: 4657,
      from: subjectAddress,
      to: baseRecipientAddress,
      transactionCategory: 'STANDARD',
      value: '1000000000000000000',
      valueTransfers: [],
    } as unknown as V1TransactionByHashResponse;

    expect(() =>
      mapApiEvmTransactions({ subjectAddress, transaction }),
    ).not.toThrow();

    const item = mapApiEvmTransactions({ subjectAddress, transaction });

    expect(item.type).toBe('send');
    expect(item.chainId).toBe('eip155:4657');
  });
});
