import { act } from '@testing-library/react-hooks';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { PERPS_WITHDRAW_ROUTE } from '../../../../helpers/constants/routes';
import { usePerpsWithdrawNavigation } from './usePerpsWithdrawNavigation';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('usePerpsWithdrawNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
