import React, { useCallback } from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MONEY_HOME_ROUTE } from '../../helpers/constants/routes';
import { useMoneyDepositDeeplink } from './use-money-deposit-deeplink';

const ROUTER_FUTURE_FLAGS = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  v7_startTransition: true,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  v7_relativeSplatPath: true,
};

const renderDeeplinkHook = ({
  initialEntry,
  isReady,
}: {
  initialEntry: string;
  isReady: boolean;
}) => {
  const initiateDeposit = jest.fn();
  const hook = renderHook(
    (props: { isReady: boolean }) => {
      const location = useLocation();
      const initiateDepositFromLocation = useCallback(
        () => initiateDeposit(location.pathname + location.search),
        [location.pathname, location.search],
      );
      useMoneyDepositDeeplink({
        isReady: props.isReady,
        initiateDeposit: initiateDepositFromLocation,
      });
      return location;
    },
    {
      initialProps: { isReady },
      wrapper: ({ children }) => (
        <MemoryRouter
          initialEntries={[initialEntry]}
          future={ROUTER_FUTURE_FLAGS}
        >
          {children}
        </MemoryRouter>
      ),
    },
  );
  return { ...hook, initiateDeposit };
};

describe('useMoneyDepositDeeplink', () => {
  it('starts a deposit once from a location without the deeplink param', () => {
    const { result, rerender, initiateDeposit } = renderDeeplinkHook({
      initialEntry: `${MONEY_HOME_ROUTE}?deposit=true`,
      isReady: true,
    });

    expect(initiateDeposit).toHaveBeenCalledTimes(1);
    expect(initiateDeposit).toHaveBeenCalledWith(MONEY_HOME_ROUTE);
    expect(result.current.search).toBe('');

    rerender({ isReady: true });

    expect(initiateDeposit).toHaveBeenCalledTimes(1);
  });

  it('keeps unrelated query params', () => {
    const { result, initiateDeposit } = renderDeeplinkHook({
      initialEntry: `${MONEY_HOME_ROUTE}?deposit=true&foo=bar`,
      isReady: true,
    });

    expect(result.current.search).toBe('?foo=bar');
    expect(initiateDeposit).toHaveBeenCalledWith(`${MONEY_HOME_ROUTE}?foo=bar`);
  });

  it('waits until the Money account is ready', () => {
    const { result, rerender, initiateDeposit } = renderDeeplinkHook({
      initialEntry: `${MONEY_HOME_ROUTE}?deposit=true`,
      isReady: false,
    });

    expect(initiateDeposit).not.toHaveBeenCalled();
    expect(result.current.search).toBe('?deposit=true');

    rerender({ isReady: true });

    expect(initiateDeposit).toHaveBeenCalledTimes(1);
    expect(result.current.search).toBe('');
  });

  it('does nothing without the deeplink param', () => {
    const { initiateDeposit } = renderDeeplinkHook({
      initialEntry: MONEY_HOME_ROUTE,
      isReady: true,
    });

    expect(initiateDeposit).not.toHaveBeenCalled();
  });
});
