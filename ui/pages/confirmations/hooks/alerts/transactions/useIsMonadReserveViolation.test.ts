import { TransactionMeta } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import type { Hex } from '@metamask/utils';
import { createElement, Fragment, PropsWithChildren } from 'react';

import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import {
  buildNativeEvmBalancePatch,
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { ConfirmContextProvider } from '../../../context/confirm';
import { useIsMonadReserveViolation } from './useIsMonadReserveViolation';

const CONFIRMATION_MOCK = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_IDS.MONAD,
}) as TransactionMeta;

const DELEGATION_ADDRESS: Hex = '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b';
const BALANCE_15_MON = toHex(15n * 10n ** 18n);
const BALANCE_7_MON = toHex(7n * 10n ** 18n);
const VALUE_6_MON = toHex(6n * 10n ** 18n);

function runHook(state: Record<string, unknown>) {
  const response = renderHookWithConfirmContextProvider(
    useIsMonadReserveViolation,
    state,
  );

  return response.result.current;
}

describe('useIsMonadReserveViolation', () => {
  it('returns false if no confirmation exists', () => {
    expect(runHook(getMockConfirmState())).toBe(false);
  });

  it('returns true when a Monad simulation failure is a reserve balance violation', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          simulationFails: {
            reason: 'execution reverted: reserve balance violation',
            debug: {},
          },
        }),
      ),
    ).toBe(true);
  });

  it('returns true when Monad call trace errors contain a reserve balance violation', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          simulationData: {
            callTraceErrors: ['reserve balance violation'],
            tokenBalanceChanges: [],
          },
        }),
      ),
    ).toBe(true);
  });

  it('returns true when a delegated account value spend would leave less than 10 MON', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            delegationAddress: DELEGATION_ADDRESS,
            txParams: {
              ...CONFIRMATION_MOCK.txParams,
              value: VALUE_6_MON,
            },
          },
          {
            metamask: buildNativeEvmBalancePatch({
              hexChainId: CHAIN_IDS.MONAD,
              amountWei: BALANCE_15_MON,
            }),
          },
        ),
      ),
    ).toBe(true);
  });

  it('returns false for a zero-value delegated transaction already under 10 MON', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            delegationAddress: DELEGATION_ADDRESS,
            txParams: {
              ...CONFIRMATION_MOCK.txParams,
              value: '0x0',
            },
          },
          {
            metamask: buildNativeEvmBalancePatch({
              hexChainId: CHAIN_IDS.MONAD,
              amountWei: BALANCE_7_MON,
            }),
          },
        ),
      ),
    ).toBe(false);
  });

  it('uses the transaction override from the confirmation context', () => {
    const override = {
      ...CONFIRMATION_MOCK,
      simulationFails: {
        reason: 'execution reverted: reserve balance violation',
        debug: {},
      },
    };
    const OverrideContainer = ({ children }: PropsWithChildren) =>
      createElement(ConfirmContextProvider, {
        currentConfirmationOverride: override,
        children: createElement(Fragment, null, children),
      });
    const state = getMockConfirmStateForTransaction({
      ...CONFIRMATION_MOCK,
      chainId: CHAIN_IDS.MAINNET,
    });

    const response = renderHookWithConfirmContextProvider(
      useIsMonadReserveViolation,
      state,
      '/',
      OverrideContainer,
    );

    expect(response.result.current).toBe(true);
  });

  it('returns false when reserve balance violation appears on a non-Monad chain', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          chainId: CHAIN_IDS.MAINNET,
          simulationFails: {
            reason: 'execution reverted: reserve balance violation',
            debug: {},
          },
        }),
      ),
    ).toBe(false);
  });

  it('returns false when Monad simulation failure is unrelated', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          simulationFails: {
            reason: 'execution reverted: out of gas',
            debug: {},
          },
        }),
      ),
    ).toBe(false);
  });
});
