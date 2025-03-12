import { renderHook } from '@testing-library/react-hooks';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import {
  EIP_7702_REVOKE_ADDRESS,
  useEIP7702Account,
} from './useEIP7702Account';
import {
  addTransactionAndRouteToConfirmationPage,
  getCode,
} from '../../../store/actions';
import { act } from '@testing-library/react';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { ThunkAction } from 'redux-thunk';
import { useConfirmationNavigation } from './useConfirmationNavigation';
import { ApprovalRequest } from '@metamask/approval-controller';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import { useDispatch } from 'react-redux';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  addTransactionAndRouteToConfirmationPage: jest.fn(),
  getCode: jest.fn(),
}));

jest.mock('./useConfirmationNavigation', () => ({
  useConfirmationNavigation: jest.fn(),
}));

const ADDRESS_MOCK = '0x1234';
const CODE_MOCK = '0xabcd';
const TRANSACTION_ID_MOCK = '1234-5678';

function runHook({ onRedirect }: { onRedirect?: () => void } = {}) {
  const { result } = renderHookWithProvider(
    () => useEIP7702Account({ onRedirect }),
    {},
  );
  return result.current;
}

describe('useEIP7702Account', () => {
  const addTransactionAndRouteToConfirmationPageMock = jest.mocked(
    addTransactionAndRouteToConfirmationPage,
  );

  const useDispatchMock = jest.mocked(useDispatch);
  const getCodeMock = jest.mocked(getCode);
  const useConfirmationNavigationMock = jest.mocked(useConfirmationNavigation);

  beforeEach(() => {
    jest.resetAllMocks();

    addTransactionAndRouteToConfirmationPageMock.mockReturnValue({
      type: 'MockAction',
    } as unknown as ReturnType<typeof addTransactionAndRouteToConfirmationPageMock>);

    useConfirmationNavigationMock.mockReturnValue({
      confirmations: [],
      navigateToId: jest.fn(),
    } as unknown as ReturnType<typeof useConfirmationNavigationMock>);

    useDispatchMock.mockReturnValue(jest.fn());
  });

  describe('isUpgraded', () => {
    it('returns true if account has code', async () => {
      getCodeMock.mockResolvedValue(CODE_MOCK);
      const result = await runHook().isUpgraded(ADDRESS_MOCK);
      expect(result).toBe(true);
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([undefined, '', '0x'])(
      'returns false if code is %s',
      async (code: string) => {
        getCodeMock.mockResolvedValue(code);
        const result = await runHook().isUpgraded(ADDRESS_MOCK);
        expect(result).toBe(false);
      },
    );
  });

  describe('downgradeAccount', () => {
    it('adds transaction', async () => {
      const { downgradeAccount } = runHook();

      await downgradeAccount(ADDRESS_MOCK);

      expect(addTransactionAndRouteToConfirmationPageMock).toHaveBeenCalledWith(
        {
          authorizationList: [
            {
              address: EIP_7702_REVOKE_ADDRESS,
            },
          ],
          from: ADDRESS_MOCK,
          to: ADDRESS_MOCK,
          type: TransactionEnvelopeType.setCode,
        },
      );
    });

    it('navigates to confirmation', async () => {
      const navigateToIdMock = jest.fn();

      useConfirmationNavigationMock.mockReturnValue({
        confirmations: [{ id: TRANSACTION_ID_MOCK }],
        navigateToId: navigateToIdMock,
      } as unknown as ReturnType<typeof useConfirmationNavigationMock>);

      useDispatchMock.mockReturnValue(
        jest.fn().mockResolvedValue({
          id: TRANSACTION_ID_MOCK,
        }),
      );

      const { downgradeAccount } = runHook();

      await act(async () => {
        await downgradeAccount(ADDRESS_MOCK);
      });

      expect(navigateToIdMock).toHaveBeenCalledTimes(1);
      expect(navigateToIdMock).toHaveBeenCalledWith(TRANSACTION_ID_MOCK);
    });

    it('calls onRedirect', async () => {
      const onRedirect = jest.fn();

      useConfirmationNavigationMock.mockReturnValue({
        confirmations: [{ id: TRANSACTION_ID_MOCK }],
        navigateToId: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmationNavigationMock>);

      useDispatchMock.mockReturnValue(
        jest.fn().mockResolvedValue({
          id: TRANSACTION_ID_MOCK,
        }),
      );

      const { downgradeAccount } = runHook({ onRedirect });

      await act(async () => {
        await downgradeAccount(ADDRESS_MOCK);
      });

      expect(onRedirect).toHaveBeenCalledTimes(1);
    });
  });
});
