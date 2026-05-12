import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { CHAIN_IDS } from '../../../constants/network';
import { mapMultiAccountTransaction } from './multiaccount-transaction';

const subjectAddress = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
const baseUsdc = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const baseRecipientAddress = '0x6fdb1e9d93c1279177b00baaf44524055455e92e';
const lineaMusd = '0xaca92e438df0b2401ff60da7e4337b687a2435da';
const lineaSenderAddress = '0xf70da97812cb96acdf810712aa562db8dfa3dbef';
const exchangeRecipient = '0x3913a8aca88c946284abbe7ab2ed671c6603de20';
const bscContractCallerAddress = '0xf70da97812cb96acdf810712aa562db8dfa3dbef';
const bscUniversalRouter = '0xca11bde05977b3631167028862be2a173976ca11';
const bscRecipientAddress = '0xb92fe925dc43a0ecde6c8b1a2709c170ec4fff4f';

describe('mapMultiAccountTransaction', () => {
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
    } as V1TransactionByHashResponse;

    expect(
      mapMultiAccountTransaction({
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
        to: baseRecipientAddress,
        tokenSymbol: 'USDC',
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
      mapMultiAccountTransaction({
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
        to: subjectAddress,
        tokenSymbol: 'mUSD',
      },
    });
  });

  it('maps an exchange transaction to a Swap activity', () => {
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
      mapMultiAccountTransaction({
        subjectAddress,
        transaction,
      }),
    ).toStrictEqual({
      type: 'swap',
      chainId: 'eip155:59144',
      status: 'success',
      timestamp: 1778003873000,
      data: {
        destinationTokenSymbol: undefined,
        sourceTokenSymbol: 'mUSD',
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
      mapMultiAccountTransaction({
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
        methodId: '0x174dea71',
        to: bscUniversalRouter,
        transactionCategory: 'CONTRACT_CALL',
        transactionProtocol: undefined,
        transactionType: 'GENERIC_CONTRACT_CALL',
      },
    });
  });
});
