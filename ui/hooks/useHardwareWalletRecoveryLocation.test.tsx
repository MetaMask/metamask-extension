import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import {
  MemoryRouter,
  type MemoryRouterProps,
  Route,
  Routes,
} from 'react-router-dom';
import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import configureStore from '../store/store';
import {
  getMockContractInteractionConfirmState,
  getMockPersonalSignConfirmStateForRequest,
} from '../../test/data/confirmations/helper';
import { unapprovedPersonalSignMsg } from '../../test/data/confirmations/personal_sign';
import { SignatureRequestType } from '../pages/confirmations/types/confirm';
import { MetaMetricsHardwareWalletRecoveryLocation } from '../../shared/constants/metametrics';
import {
  CONFIRMATION_V_NEXT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../helpers/constants/routes';
import { useHardwareWalletRecoveryLocation } from './useHardwareWalletRecoveryLocation';

function getFirstTransactionMeta(
  base: ReturnType<typeof getMockContractInteractionConfirmState>,
): TransactionMeta {
  // Mock root state types `transactions` loosely; contract-interaction data is TransactionMeta.
  return base.metamask.transactions[0] as unknown as TransactionMeta;
}

function createHookWrapper(
  store: ReturnType<typeof configureStore>,
  initialPath: string,
  routePath = '*',
) {
  const memoryRouterFuture = {
    ['v7_startTransition' as keyof NonNullable<MemoryRouterProps['future']>]:
      true,
    ['v7_relativeSplatPath' as keyof NonNullable<MemoryRouterProps['future']>]:
      true,
  } as NonNullable<MemoryRouterProps['future']>;

  function hookTestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[initialPath]}
          future={memoryRouterFuture}
        >
          <Routes>
            <Route path={routePath} element={<>{children}</>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  }
  return hookTestWrapper;
}

describe('useHardwareWalletRecoveryLocation', () => {
  it('returns Swaps for cross-chain route', () => {
    const store = configureStore(getMockContractInteractionConfirmState());
    const { result } = renderHook(() => useHardwareWalletRecoveryLocation(), {
      wrapper: createHookWrapper(
        store,
        `${CROSS_CHAIN_SWAP_ROUTE}/prepare`,
        `${CROSS_CHAIN_SWAP_ROUTE}/*`,
      ),
    });
    expect(result.current).toBe(
      MetaMetricsHardwareWalletRecoveryLocation.Swaps,
    );
  });

  it('returns Swaps when pathname includes /swaps/', () => {
    const store = configureStore(getMockContractInteractionConfirmState());
    const { result } = renderHook(() => useHardwareWalletRecoveryLocation(), {
      wrapper: createHookWrapper(store, '/foo/swaps/bar', '*'),
    });
    expect(result.current).toBe(
      MetaMetricsHardwareWalletRecoveryLocation.Swaps,
    );
  });

  it('returns Message for signature request path', () => {
    const path = `/dapp${SIGNATURE_REQUEST_PATH}/1`;
    const store = configureStore(getMockContractInteractionConfirmState());
    const { result } = renderHook(() => useHardwareWalletRecoveryLocation(), {
      wrapper: createHookWrapper(store, path, '*'),
    });
    expect(result.current).toBe(
      MetaMetricsHardwareWalletRecoveryLocation.Message,
    );
  });

  it('returns Message on confirm route when pending message matches confirmation id', () => {
    const msg = {
      ...unapprovedPersonalSignMsg,
      id: 'sig-1',
    } as SignatureRequestType;
    const state = getMockPersonalSignConfirmStateForRequest(msg);
    const store = configureStore(state);
    const { result } = renderHook(() => useHardwareWalletRecoveryLocation(), {
      wrapper: createHookWrapper(
        store,
        `${CONFIRM_TRANSACTION_ROUTE}/sig-1`,
        `${CONFIRM_TRANSACTION_ROUTE}/:id/*`,
      ),
    });
    expect(result.current).toBe(
      MetaMetricsHardwareWalletRecoveryLocation.Message,
    );
  });

  const swapFlowTypes = [
    TransactionType.swap,
    TransactionType.swapApproval,
    TransactionType.bridge,
  ] as const;
  swapFlowTypes.forEach((txType) => {
    it(`returns Swaps on confirm route when transaction type is ${txType}`, () => {
      const base = getMockContractInteractionConfirmState();
      const tx = getFirstTransactionMeta(base);
      const store = configureStore({
        ...base,
        metamask: {
          ...base.metamask,
          transactions: [{ ...tx, type: txType }],
        },
      });
      const { result } = renderHook(() => useHardwareWalletRecoveryLocation(), {
        wrapper: createHookWrapper(
          store,
          `${CONFIRM_TRANSACTION_ROUTE}/${tx.id}`,
          `${CONFIRM_TRANSACTION_ROUTE}/:id/*`,
        ),
      });
      expect(result.current).toBe(
        MetaMetricsHardwareWalletRecoveryLocation.Swaps,
      );
    });
  });

  it('returns Send on confirm route for non-swap transaction', () => {
    const base = getMockContractInteractionConfirmState();
    const tx = getFirstTransactionMeta(base);
    const store = configureStore(base);
    const { result } = renderHook(() => useHardwareWalletRecoveryLocation(), {
      wrapper: createHookWrapper(
        store,
        `${CONFIRM_TRANSACTION_ROUTE}/${tx.id}`,
        `${CONFIRM_TRANSACTION_ROUTE}/:id/*`,
      ),
    });
    expect(result.current).toBe(MetaMetricsHardwareWalletRecoveryLocation.Send);
  });

  it('returns Send for confirmation v-next route without swap or message', () => {
    const base = getMockContractInteractionConfirmState();
    const tx = getFirstTransactionMeta(base);
    const store = configureStore(base);
    const { result } = renderHook(() => useHardwareWalletRecoveryLocation(), {
      wrapper: createHookWrapper(
        store,
        `${CONFIRMATION_V_NEXT_ROUTE}/${tx.id}`,
        `${CONFIRMATION_V_NEXT_ROUTE}/:id/*`,
      ),
    });
    expect(result.current).toBe(MetaMetricsHardwareWalletRecoveryLocation.Send);
  });

  it('returns Send as default for unrelated routes', () => {
    const store = configureStore(getMockContractInteractionConfirmState());
    const { result } = renderHook(() => useHardwareWalletRecoveryLocation(), {
      wrapper: createHookWrapper(store, '/settings', '*'),
    });
    expect(result.current).toBe(MetaMetricsHardwareWalletRecoveryLocation.Send);
  });
});
