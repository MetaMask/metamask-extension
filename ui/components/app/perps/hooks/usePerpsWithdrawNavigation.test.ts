import React from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-hooks';
import { MemoryRouter } from 'react-router-dom';
import mockState from '../../../../../test/data/mock-state.json';
import {
  CONFIRM_TRANSACTION_ROUTE,
  PERPS_WITHDRAW_ROUTE,
} from '../../../../helpers/constants/routes';
import { ConfirmationLoader } from '../../../../pages/confirmations/hooks/useConfirmationNavigation';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import { createPerpsWithdrawTransaction } from './createPerpsWithdrawTransaction';
import { usePerpsWithdrawNavigation } from './usePerpsWithdrawNavigation';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../../shared/lib/selectors/accounts', () => ({
  getSelectedInternalAccount: jest.fn(),
}));

jest.mock(
  '../../../../pages/confirmations/hooks/useConfirmationNavigation',
  () => ({
    ConfirmationLoader: {
      CustomAmount: 'customAmount',
    },
  }),
);

jest.mock('./createPerpsWithdrawTransaction', () => ({
  createPerpsWithdrawTransaction: jest.fn(),
}));

const getSelectedInternalAccountMock = jest.mocked(getSelectedInternalAccount);
const mockCreatePerpsWithdrawTransaction = jest.mocked(
  createPerpsWithdrawTransaction,
);

const MOCK_ACCOUNT_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_TX_ID = 'withdraw-tx-id';

function createMockStore(state = mockState) {
  return {
    getState: () => state,
    subscribe: jest.fn(() => jest.fn()),
    dispatch: jest.fn(),
  };
}

function buildStateWithPerpsWithdrawFlag(enabled: boolean) {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        /* eslint-disable @typescript-eslint/naming-convention */
        confirmations_pay_post_quote: {
          perpsWithdraw: { enabled },
        },
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    },
  };
}

function renderUsePerpsWithdrawNavigation(
  hook: () => ReturnType<typeof usePerpsWithdrawNavigation>,
  state = mockState,
  pathname = '/',
) {
  const store = createMockStore(state);
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      Provider,
      { store: store as never },
      React.createElement(
        MemoryRouter,
        {
          initialEntries: [pathname],
          future: {
            /* eslint-disable @typescript-eslint/naming-convention */
            v7_relativeSplatPath: true,
            v7_startTransition: true,
            /* eslint-enable @typescript-eslint/naming-convention */
          },
        },
        children,
      ),
    );

  return renderHook(hook, { wrapper });
}

describe('usePerpsWithdrawNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSelectedInternalAccountMock.mockReturnValue({
      address: MOCK_ACCOUNT_ADDRESS,
    } as never);
    mockCreatePerpsWithdrawTransaction.mockResolvedValue({
      transactionId: MOCK_TX_ID,
    });
  });

  it('navigates to legacy perps withdraw route by default', async () => {
    const { result } = renderUsePerpsWithdrawNavigation(
      () => usePerpsWithdrawNavigation(),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockNavigate).toHaveBeenCalledWith(PERPS_WITHDRAW_ROUTE);
    expect(mockCreatePerpsWithdrawTransaction).not.toHaveBeenCalled();
    expect(triggerResult).toStrictEqual({ route: PERPS_WITHDRAW_ROUTE });
  });

  it('does not navigate to legacy route when navigateOnTrigger is false', async () => {
    const { result } = renderUsePerpsWithdrawNavigation(
      () => usePerpsWithdrawNavigation({ navigateOnTrigger: false }),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockCreatePerpsWithdrawTransaction).not.toHaveBeenCalled();
    expect(triggerResult).toStrictEqual({ route: PERPS_WITHDRAW_ROUTE });
  });

  it('invokes onNavigated with route', async () => {
    const onNavigated = jest.fn();

    const { result } = renderUsePerpsWithdrawNavigation(
      () => usePerpsWithdrawNavigation({ onNavigated }),
      mockState,
    );

    await act(async () => {
      await result.current.trigger();
    });

    expect(onNavigated).toHaveBeenCalledWith(PERPS_WITHDRAW_ROUTE);
  });

  it('creates a perpsWithdraw transaction and navigates to confirmation when the flag is enabled', async () => {
    const { result } = renderUsePerpsWithdrawNavigation(
      () => usePerpsWithdrawNavigation(),
      buildStateWithPerpsWithdrawFlag(true),
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockCreatePerpsWithdrawTransaction).toHaveBeenCalledWith({
      accountAddress: MOCK_ACCOUNT_ADDRESS,
    });
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: `${CONFIRM_TRANSACTION_ROUTE}/${MOCK_TX_ID}`,
      search: `loader=${ConfirmationLoader.CustomAmount}`,
    });
    expect(triggerResult).toStrictEqual({
      route: `${CONFIRM_TRANSACTION_ROUTE}/${MOCK_TX_ID}`,
      transactionId: MOCK_TX_ID,
    });
  });

  it('adds goBackTo when confirmation flow starts from a non-root route', async () => {
    const { result } = renderUsePerpsWithdrawNavigation(
      () => usePerpsWithdrawNavigation(),
      buildStateWithPerpsWithdrawFlag(true),
      '/perps/trade/BTC',
    );

    await act(async () => {
      await result.current.trigger();
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: `${CONFIRM_TRANSACTION_ROUTE}/${MOCK_TX_ID}`,
      search: `loader=${ConfirmationLoader.CustomAmount}&goBackTo=%2Fperps%2Ftrade%2FBTC`,
    });
  });

  it('creates confirmation transaction without navigating when navigateOnTrigger is false', async () => {
    const { result } = renderUsePerpsWithdrawNavigation(
      () =>
        usePerpsWithdrawNavigation({
          navigateOnTrigger: false,
        }),
      buildStateWithPerpsWithdrawFlag(true),
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockCreatePerpsWithdrawTransaction).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(triggerResult).toStrictEqual({
      route: `${CONFIRM_TRANSACTION_ROUTE}/${MOCK_TX_ID}`,
      transactionId: MOCK_TX_ID,
    });
  });

  it('returns null when confirmation transaction creation fails', async () => {
    mockCreatePerpsWithdrawTransaction.mockRejectedValueOnce(
      new Error('create failed'),
    );
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const { result } = renderUsePerpsWithdrawNavigation(
      () => usePerpsWithdrawNavigation(),
      buildStateWithPerpsWithdrawFlag(true),
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(triggerResult).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('returns null when there is no selected account', async () => {
    getSelectedInternalAccountMock.mockReturnValue(undefined as never);

    const { result } = renderUsePerpsWithdrawNavigation(
      () => usePerpsWithdrawNavigation(),
      mockState,
    );

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockCreatePerpsWithdrawTransaction).not.toHaveBeenCalled();
    expect(triggerResult).toBeNull();
    consoleErrorSpy.mockRestore();
  });

  it('allows sequential triggers after each completes', async () => {
    const { result } = renderUsePerpsWithdrawNavigation(
      () => usePerpsWithdrawNavigation(),
      mockState,
    );

    await act(async () => {
      await result.current.trigger();
    });
    await act(async () => {
      await result.current.trigger();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(2);
  });

  it('returns null and logs when navigate throws', async () => {
    mockNavigate.mockImplementationOnce(() => {
      throw new Error('nav failed');
    });
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const { result } = renderUsePerpsWithdrawNavigation(
      () => usePerpsWithdrawNavigation(),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(triggerResult).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
