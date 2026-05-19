import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { CHAIN_IDS } from '../../../constants/network';
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

    expect(
      mapApiEvmTransactions({
        subjectAddress,
        transaction,
      }),
    ).toStrictEqual({
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

    expect(
      mapApiEvmTransactions({
        subjectAddress,
        transaction,
      }),
    ).toStrictEqual({
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

    expect(
      mapApiEvmTransactions({
        subjectAddress,
        transaction,
      }),
    ).toStrictEqual({
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

    expect(
      mapApiEvmTransactions({
        subjectAddress,
        transaction,
      }),
    ).toStrictEqual({
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
          contractAddress: baseAaveUsdc,
          symbol: 'aBasUSDC',
        },
        {
          from: subjectAddress,
          to: baseAaveUsdc,
          contractAddress: baseUsdc,
          symbol: 'USDC',
        },
      ],
    } as V1TransactionByHashResponse;

    expect(
      mapApiEvmTransactions({
        subjectAddress,
        transaction,
      }),
    ).toStrictEqual({
      type: 'lendingDeposit',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1778643089000,
      data: {
        hash: '0x08d14578168f22001e95503469c63613bd9f3d3f60e81dbbf204fbd21f484bd9',
        token: {
          direction: 'out',
          symbol: 'USDC',
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

    expect(
      mapApiEvmTransactions({
        subjectAddress,
        transaction,
      }),
    ).toStrictEqual({
      type: 'claimMusdBonus',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1778633325000,
      data: {
        hash: '0x875ded271a40278391fca5d71892231afd0cb9592f31bdf3b7c949906cb982c4',
        token: {
          direction: 'in',
          symbol: 'mUSD',
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

    expect(
      mapApiEvmTransactions({
        subjectAddress,
        transaction,
      }),
    ).toStrictEqual({
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
