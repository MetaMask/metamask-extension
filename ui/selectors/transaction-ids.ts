import { createSelector } from 'reselect';
import type { MetaMaskReduxState } from '../store/store';
import { EMPTY_ARRAY } from './shared';

const selectTransactions = (state: MetaMaskReduxState) =>
  state.metamask?.transactions ?? EMPTY_ARRAY;

export const selectTransactionIds = createSelector(
  selectTransactions,
  (transactions) => new Set<string>(transactions.map((tx) => tx.id)),
);
