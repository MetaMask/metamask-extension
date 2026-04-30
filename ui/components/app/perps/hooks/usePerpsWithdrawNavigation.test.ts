import { act } from '@testing-library/react-hooks';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { PERPS_WITHDRAW_ROUTE } from '../../../../helpers/constants/routes';
import { usePerpsWithdrawConfirmation } from './usePerpsWithdrawConfirmation';
import { usePerpsWithdrawNavigation } from './usePerpsWithdrawNavigation';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('./usePerpsWithdrawConfirmation', () => ({
  usePerpsWithdrawConfirmation: jest.fn(),
}));

const mockUsePerpsWithdrawConfirmation =
  usePerpsWithdrawConfirmation as jest.MockedFunction<
    typeof usePerpsWithdrawConfirmation
  >;
const mockTriggerWithdrawConfirmation = jest.fn();

const stateWithConfirmationFlag = (enabled: boolean) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    remoteFeatureFlags: {
      ...mockState.metamask.remoteFeatureFlags,
      perpsWithdrawConfirmation: enabled,
    },
  },
});

describe('usePerpsWithdrawNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTriggerWithdrawConfirmation.mockResolvedValue({
      transactionId: 'tx-confirmation',
    });
    mockUsePerpsWithdrawConfirmation.mockReturnValue({
      trigger: mockTriggerWithdrawConfirmation,
      isLoading: false,
    });
  });

  it('navigates to perps withdraw route by default', async () => {
    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawNavigation(),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockNavigate).toHaveBeenCalledWith(PERPS_WITHDRAW_ROUTE);
    expect(triggerResult).toStrictEqual({ route: PERPS_WITHDRAW_ROUTE });
  });

  it('does not navigate when navigateOnTrigger is false', async () => {
    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawNavigation({ navigateOnTrigger: false }),
      mockState,
    );

    let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
      null;
    await act(async () => {
      triggerResult = await result.current.trigger();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(triggerResult).toStrictEqual({ route: PERPS_WITHDRAW_ROUTE });
  });

  it('invokes onNavigated with route', async () => {
    const onNavigated = jest.fn();

    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawNavigation({ onNavigated }),
      mockState,
    );

    await act(async () => {
      await result.current.trigger();
    });

    expect(onNavigated).toHaveBeenCalledWith(PERPS_WITHDRAW_ROUTE);
  });

  it('returns null when there is no selected account', async () => {
    const stateWithoutSelectedAccount = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        internalAccounts: {
          ...mockState.metamask.internalAccounts,
          selectedAccount: '',
        },
      },
    };

    const { result } = renderHookWithProvider(
      () => usePerpsWithdrawNavigation(),
      stateWithoutSelectedAccount,
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
    expect(triggerResult).toBeNull();
    consoleErrorSpy.mockRestore();
  });

  it('allows sequential triggers after each completes', async () => {
    const { result } = renderHookWithProvider(
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

    const { result } = renderHookWithProvider(
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

  describe('when perpsWithdrawConfirmation feature flag is enabled', () => {
    it('delegates to usePerpsWithdrawConfirmation and reports the confirmation route', async () => {
      const onNavigated = jest.fn();

      const { result } = renderHookWithProvider(
        () => usePerpsWithdrawNavigation({ onNavigated }),
        stateWithConfirmationFlag(true),
      );

      let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
        null;
      await act(async () => {
        triggerResult = await result.current.trigger();
      });

      expect(mockTriggerWithdrawConfirmation).toHaveBeenCalledTimes(1);
      // Skips the legacy `/perps/withdraw` route entirely.
      expect(mockNavigate).not.toHaveBeenCalled();
      const expectedRoute = `${PERPS_WITHDRAW_ROUTE}#confirmation`;
      expect(triggerResult).toStrictEqual({ route: expectedRoute });
      expect(onNavigated).toHaveBeenCalledWith(expectedRoute);
    });

    it('returns null when the confirmation hook returns null', async () => {
      mockTriggerWithdrawConfirmation.mockResolvedValueOnce(null);
      const onNavigated = jest.fn();

      const { result } = renderHookWithProvider(
        () => usePerpsWithdrawNavigation({ onNavigated }),
        stateWithConfirmationFlag(true),
      );

      let triggerResult: Awaited<ReturnType<typeof result.current.trigger>> =
        null;
      await act(async () => {
        triggerResult = await result.current.trigger();
      });

      expect(triggerResult).toBeNull();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(onNavigated).not.toHaveBeenCalled();
    });

    it('forwards navigateOnTrigger=false to the confirmation hook', async () => {
      const { result } = renderHookWithProvider(
        () => usePerpsWithdrawNavigation({ navigateOnTrigger: false }),
        stateWithConfirmationFlag(true),
      );

      await act(async () => {
        await result.current.trigger();
      });

      // The confirmation hook is configured with `navigateOnCreate` matching
      // the caller's `navigateOnTrigger` so a `navigateOnTrigger: false` caller
      // gets a transaction id without an automatic navigation side effect.
      expect(mockUsePerpsWithdrawConfirmation).toHaveBeenCalledWith({
        navigateOnCreate: false,
      });
    });
  });
});
