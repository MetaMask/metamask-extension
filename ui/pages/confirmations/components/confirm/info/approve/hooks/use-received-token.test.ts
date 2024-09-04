import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedApproveConfirmation,
} from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../../test/lib/render-helpers';
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
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(() => useReceivedToken(), {
      ...mockState,
      confirm: { currentConfirmation: transactionMeta },
    });

    expect(result.current.receivedToken).toMatchInlineSnapshot(`
      {
        "address": "0x076146c765189d51be3160a2140cf80bfc73ad68",
        "symbol": "Nice",
      }
    `);
  });
});
