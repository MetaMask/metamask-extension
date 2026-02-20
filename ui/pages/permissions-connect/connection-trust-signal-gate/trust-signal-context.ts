import { createContext, useContext } from 'react';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';

export type TrustSignalContextValue = {
  state: TrustSignalDisplayState;
};

export const TrustSignalContext = createContext<TrustSignalContextValue>({
  state: TrustSignalDisplayState.Unknown,
});

export function useTrustSignalContext(): TrustSignalContextValue {
  return useContext(TrustSignalContext);
}
