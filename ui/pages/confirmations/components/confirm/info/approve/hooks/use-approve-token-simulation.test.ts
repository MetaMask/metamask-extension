import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { useApproveTokenSimulation } from './use-approve-token-simulation';
import { useIsNFT } from './use-is-nft';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';

jest.mock('./use-is-nft', () => ({
  ...jest.requireActual('./use-is-nft'),
  useIsNFT: jest.fn(),
}));

jest.mock('../../hooks/useDecodedTransactionData', () => ({
  ...jest.requireActual('../../hooks/useDecodedTransactionData'),
  useDecodedTransactionData: jest.fn(),
}));

describe('useApproveTokenSimulation', () => {
  it('returns the token id for NFT', async () => {
    const useIsNFTMock = jest.fn().mockImplementation(() => ({ isNFT: true }));

    const useDecodedTransactionDataMock = jest.fn().mockImplementation(() => ({
      pending: false,
      value: {
        data: [
          {
            name: 'approve',
            params: [
              {
                type: 'address',
                value: '0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4',
              },
              {
                type: 'uint256',
                value: 70000,
              },
            ],
          },
        ],
        source: 'FourByte',
      },
    }));

    (useIsNFT as jest.Mock).mockImplementation(useIsNFTMock);
    (useDecodedTransactionData as jest.Mock).mockImplementation(
      useDecodedTransactionDataMock,
    );

    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useApproveTokenSimulation(transactionMeta),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "formattedTokenNum": 70000,
        "pending": false,
        "tokenAmount": "#70000",
        "value": {
          "data": [
            {
              "name": "approve",
              "params": [
                {
                  "type": "address",
                  "value": "0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4",
                },
                {
                  "type": "uint256",
                  "value": 70000,
                },
              ],
            },
          ],
          "source": "FourByte",
        },
      }
    `);
  });

  it('returns "Unlimited" token amount for 10 ** 16 fungible tokens', async () => {
    const useIsNFTMock = jest.fn().mockResolvedValue({ isNFT: false });

    const useDecodedTransactionDataMock = jest.fn().mockImplementation(() => ({
      pending: false,
      value: {
        data: [
          {
            name: 'approve',
            params: [
              {
                type: 'address',
                value: '0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4',
              },
              {
                type: 'uint256',
                value: 10 ** 16,
              },
            ],
          },
        ],
        source: 'FourByte',
      },
    }));

    (useIsNFT as jest.Mock).mockImplementation(useIsNFTMock);
    (useDecodedTransactionData as jest.Mock).mockImplementation(
      useDecodedTransactionDataMock,
    );

    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useApproveTokenSimulation(transactionMeta),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "formattedTokenNum": "10,000,000,000,000,000",
        "pending": false,
        "tokenAmount": "Unlimited",
        "value": {
          "data": [
            {
              "name": "approve",
              "params": [
                {
                  "type": "address",
                  "value": "0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4",
                },
                {
                  "type": "uint256",
                  "value": 10000000000000000,
                },
              ],
            },
          ],
          "source": "FourByte",
        },
      }
    `);
  });
});
