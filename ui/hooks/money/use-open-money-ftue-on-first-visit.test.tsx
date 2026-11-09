import { act } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { closeMoneyFtue } from '../../ducks/money-ftue';
import { useOpenMoneyFtueOnFirstVisit } from './use-open-money-ftue-on-first-visit';

type HookProps = {
  isAvailable: boolean;
  isLoading: boolean;
};

const renderFirstVisitHook = (
  initialProps: HookProps,
  moneyFtueSeen = false,
) => {
  const props = { ...initialProps };
  const rendered = renderHookWithProvider(
    () => useOpenMoneyFtueOnFirstVisit(props),
    { metamask: { moneyFtueSeen } },
  );

  return { ...rendered, props };
};

describe('useOpenMoneyFtueOnFirstVisit', () => {
  it('opens the splash when Money is available and unseen', () => {
    const { store } = renderFirstVisitHook({
      isAvailable: true,
      isLoading: false,
    });

    expect(store.getState().moneyFtue).toStrictEqual({
      isOpen: true,
      source: 'moneyHome',
      pendingDeposit: null,
      acknowledged: false,
    });
  });

  it('does not open when the splash has already been seen', () => {
    const { store } = renderFirstVisitHook(
      { isAvailable: true, isLoading: false },
      true,
    );

    expect(store.getState().moneyFtue.isOpen).toBe(false);
  });

  it('does not open while availability is loading', () => {
    const { store } = renderFirstVisitHook({
      isAvailable: true,
      isLoading: true,
    });

    expect(store.getState().moneyFtue.isOpen).toBe(false);
  });

  it('does not open when Money is unavailable', () => {
    const { store } = renderFirstVisitHook({
      isAvailable: false,
      isLoading: false,
    });

    expect(store.getState().moneyFtue.isOpen).toBe(false);
  });

  it('does not reopen on the same mount after the splash is closed', () => {
    const { store, rerender, props } = renderFirstVisitHook({
      isAvailable: true,
      isLoading: false,
    });

    act(() => {
      store.dispatch(closeMoneyFtue());
    });
    expect(store.getState().moneyFtue.isOpen).toBe(false);

    props.isLoading = true;
    rerender();
    props.isLoading = false;
    rerender();

    expect(store.getState().moneyFtue.isOpen).toBe(false);
  });
});
