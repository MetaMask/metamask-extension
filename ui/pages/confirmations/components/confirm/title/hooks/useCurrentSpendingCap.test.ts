import { waitFor } from '@testing-library/react';
import { ERC20 } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { CONTRACT_INTERACTION_SENDER_ADDRESS } from '../../../../../../../test/data/confirmations/contract-interaction';
import {
  genUnapprovedApproveConfirmation,
  genUnapprovedPermit2ApproveConfirmation,
  PERMIT2_TOKEN_ADDRESS,
} from '../../../../../../../test/data/confirmations/token-approve';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import {
  getTokenStandardAndDetailsByChain,
  TokenStandAndDetails,
} from '../../../../../../store/actions';
import { useCurrentSpendingCap } from './useCurrentSpendingCap';

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getTokenStandardAndDetailsByChain: jest.fn(),
}));

describe('useCurrentSpendingCap', () => {
  it('returns the correct spending cap', async () => {
    const transactionMeta = genUnapprovedApproveConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useCurrentSpendingCap(transactionMeta),
      mockState,
    );

    await waitFor(() => {
      expect(result.current.customSpendingCap).toMatchInlineSnapshot(`"#1"`);
    });
  });

  it('uses the decimals of the calldata token for Permit2 approvals', async () => {
    jest
      .mocked(getTokenStandardAndDetailsByChain)
      .mockImplementation(async (address) =>
        address === PERMIT2_TOKEN_ADDRESS
          ? { standard: ERC20, decimals: '6', symbol: 'USDC' }
          : ({} as TokenStandAndDetails),
      );

    const transactionMeta =
      genUnapprovedPermit2ApproveConfirmation() as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useCurrentSpendingCap(transactionMeta),
      mockState,
    );

    await waitFor(() => {
      expect(result.current.customSpendingCap).toBe('1.5');
    });
  });
});
