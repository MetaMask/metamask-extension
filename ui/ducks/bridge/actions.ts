import { swapsSlice } from '../swaps/swaps';
import { bridgeSlice } from './bridge';

// Bridge actions

// eslint-disable-next-line no-empty-pattern
const {} = swapsSlice.actions;

export const { setToChain } = bridgeSlice.actions;
