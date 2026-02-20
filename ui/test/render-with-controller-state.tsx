import React from 'react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { MemoryRouter } from 'react-router-dom';
import type { StateConstraint } from '@metamask/base-controller';
import { StateSubscriptionService } from '../store/state-subscription-service';
import { StateSubscriptionServiceContext } from '../hooks/useControllerState';

/**
 * Static lookup from flat `state.metamask` property names to the controller
 * that owns them. This enables existing tests to pass flat `metamaskState`
 * mocks unchanged — the utility maps them back to keyed controller state.
 *
 * This table is intentionally minimal for the POC. A full table can be
 * generated from the `ControllerRegistry` config at build time.
 */
const FLAT_PROPERTY_TO_CONTROLLER: Record<string, string> = {
  // KeyringController
  isUnlocked: 'KeyringController',
  keyrings: 'KeyringController',
  vault: 'KeyringController',

  // PreferencesController
  currentLocale: 'PreferencesController',
  featureFlags: 'PreferencesController',
  textDirection: 'PreferencesController',
  useBlockie: 'PreferencesController',
  useNativeCurrencyAsPrimaryCurrency: 'PreferencesController',

  // CurrencyRateController
  currentCurrency: 'CurrencyRateController',
  currencyRates: 'CurrencyRateController',

  // NetworkController
  selectedNetworkClientId: 'NetworkController',
  networkConfigurationsByChainId: 'NetworkController',

  // AccountsController
  internalAccounts: 'AccountsController',

  // TokensController
  tokens: 'TokensController',
  allTokens: 'TokensController',

  // TransactionController
  transactions: 'TransactionController',

  // AddressBookController
  addressBook: 'AddressBookController',

  // GasFeeController
  gasFeeEstimates: 'GasFeeController',
  gasEstimateType: 'GasFeeController',

  // LoggingController
  logs: 'LoggingController',
};

/**
 * Map flat `state.metamask` properties to keyed controller state.
 *
 * Groups properties by their owning controller, producing the
 * `Record<ControllerName, ControllerState>` shape that
 * {@link StateSubscriptionService} expects.
 *
 * Unknown properties are placed in a catch-all `_unmapped` controller so
 * tests still work even if the lookup table is incomplete.
 * @param flat
 */
export function mapFlatStateToControllers(
  flat: Record<string, unknown>,
): Record<string, StateConstraint> {
  const keyed: Record<string, Record<string, unknown>> = {};

  for (const [prop, value] of Object.entries(flat)) {
    const controller = FLAT_PROPERTY_TO_CONTROLLER[prop] ?? '_unmapped';
    if (!keyed[controller]) {
      keyed[controller] = {};
    }
    keyed[controller][prop] = value;
  }

  return keyed as Record<string, StateConstraint>;
}

type RenderWithControllerStateOptions = {
  controllerState?: Record<string, StateConstraint>;
  metamaskState?: Record<string, unknown>;
  pathname?: string;
};

/**
 * Test utility that parallels `renderWithProvider` but uses
 * {@link StateSubscriptionService} instead of the Redux `metamask` slice.
 *
 * Supports two input modes:
 *
 * (1) `controllerState` — keyed state passed directly to SSS.
 * (2) `metamaskState` — flat state auto-mapped to controllers via
 * {@link mapFlatStateToControllers}, letting existing tests pass their
 * flat mocks unchanged during the migration.
 *
 * @param component
 * @param options
 * @example
 * ```ts
 * renderWithControllerState(<MyComponent />, {
 *   controllerState: {
 *     KeyringController: { isUnlocked: true },
 *     PreferencesController: { currentLocale: 'en' },
 *   },
 * });
 *
 * // OR: flat state auto-mapped
 * renderWithControllerState(<MyComponent />, {
 *   metamaskState: { isUnlocked: true, currentLocale: 'en' },
 * });
 * ```
 */
export function renderWithControllerState(
  component: React.ReactElement,
  options: RenderWithControllerStateOptions = {},
) {
  const sss = new StateSubscriptionService();
  const keyedState =
    options.controllerState ??
    mapFlatStateToControllers(options.metamaskState ?? {});
  sss.initialize(keyedState);

  const Wrapper = ({ children }: { children?: React.ReactNode }) => (
    <StateSubscriptionServiceContext.Provider value={sss}>
      <MemoryRouter initialEntries={[options.pathname ?? '/']}>
        {children}
      </MemoryRouter>
    </StateSubscriptionServiceContext.Provider>
  );

  return {
    ...render(component, { wrapper: Wrapper }),
    stateSubscriptionService: sss,
  };
}

/**
 * Render a hook with {@link StateSubscriptionService} context.
 *
 * Same API shape as `renderHookWithProvider` but using SSS.
 * @param hook
 * @param options
 */
export function renderHookWithControllerState<TResult>(
  hook: () => TResult,
  options: RenderWithControllerStateOptions = {},
) {
  const sss = new StateSubscriptionService();
  const keyedState =
    options.controllerState ??
    mapFlatStateToControllers(options.metamaskState ?? {});
  sss.initialize(keyedState);

  const Wrapper = ({ children }: { children?: React.ReactNode }) => (
    <StateSubscriptionServiceContext.Provider value={sss}>
      <MemoryRouter initialEntries={[options.pathname ?? '/']}>
        {children}
      </MemoryRouter>
    </StateSubscriptionServiceContext.Provider>
  );

  return {
    ...renderHook(hook, { wrapper: Wrapper }),
    stateSubscriptionService: sss,
  };
}
