import { TransactionMeta } from '@metamask/transaction-controller';

import { CONTRACT_INTERACTION_SENDER_ADDRESS } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import {
  genUnapprovedApproveConfirmation,
  genUnapprovedPermit2ApproveConfirmation,
  PERMIT2_TOKEN_ADDRESS,
} from '../../../../../../../../test/data/confirmations/token-approve';
import { renderHookWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { useAccountTotalFiatBalance } from '../../../../../../../hooks/useAccountTotalFiatBalance';
import { useReceivedToken } from './use-received-token';

jest.mock('../../../../../../../hooks/useAccountTotalFiatBalance', () => ({
  ...jest.requireActual(
    '../../../../../../../hooks/useAccountTotalFiatBalance',
  ),
  useAccountTotalFiatBalance: jest.fn(),
}));

describe('useReceivedToken', () => {
  it('returns receivedToken correctly', async () => {
    const useAccountTotalFiatBalanceMock = jest.fn().mockImplementation(() => ({
      tokensWithBalances: [
        {
          address: '0x076146c765189d51be3160a2140cf80bfc73ad68',
          symbol: 'Nice',
        },
      ],
    }));

    (useAccountTotalFiatBalance as jest.Mock).mockImplementation(
      useAccountTotalFiatBalanceMock,
    );

    const transactionMeta = genUnapprovedApproveConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
      chainId: '0x5',
    }) as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useReceivedToken(),
      getMockConfirmStateForTransaction(transactionMeta),
    );

    expect(result.current.receivedToken).toMatchInlineSnapshot(`
      {
        "address": "0x076146c765189d51be3160a2140cf80bfc73ad68",
        "symbol": "Nice",
      }
    `);
  });

  it('returns the token from the calldata for Permit2 approvals', () => {
    const permit2Token = {
      address: PERMIT2_TOKEN_ADDRESS,
      symbol: 'USDC',
    };

    (useAccountTotalFiatBalance as jest.Mock).mockReturnValue({
      tokensWithBalances: [permit2Token],
    });

    const transactionMeta =
      genUnapprovedPermit2ApproveConfirmation() as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useReceivedToken(),
      getMockConfirmStateForTransaction(transactionMeta),
    );

    expect(result.current.receivedToken).toStrictEqual(permit2Token);
  });
});
