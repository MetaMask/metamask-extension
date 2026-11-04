import type { MetaMaskReduxState } from '../../store/store';
import type {
  MoneyFtuePendingDeposit,
  MoneyFtueSource,
  MoneyFtueState,
} from './money-ftue';

export {
  default as moneyFtueReducer,
  openMoneyFtue,
  closeMoneyFtue,
  initialState,
} from './money-ftue';
export type {
  MoneyFtuePendingDeposit,
  MoneyFtueSource,
  MoneyFtueState,
} from './money-ftue';

/**
 * Selects whether the Money FTUE splash is open.
 *
 * @param state - The MetaMask state object.
 * @returns Whether the splash is open.
 */
export const selectIsMoneyFtueOpen = (state: MetaMaskReduxState): boolean =>
  Boolean((state.moneyFtue as MoneyFtueState | undefined)?.isOpen);

/**
 * Selects what opened the Money FTUE splash.
 *
 * @param state - The MetaMask state object.
 * @returns The splash source, or null when closed.
 */
export const selectMoneyFtueSource = (
  state: MetaMaskReduxState,
): MoneyFtueSource | null =>
  (state.moneyFtue as MoneyFtueState | undefined)?.source ?? null;

/**
 * Selects the deposit intent that should continue after the splash closes.
 *
 * @param state - The MetaMask state object.
 * @returns The pending deposit, or null when there is none.
 */
export const selectMoneyFtuePendingDeposit = (
  state: MetaMaskReduxState,
): MoneyFtuePendingDeposit | null =>
  (state.moneyFtue as MoneyFtueState | undefined)?.pendingDeposit ?? null;
