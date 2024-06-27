import { swapsSlice } from '../swaps/swaps';
import { bridgeSlice } from './bridge';

// Proxied swaps actions
export const { setFromToken, setToToken } = swapsSlice.actions;

// Bridge actions
export const { setToChain } = bridgeSlice.actions;
