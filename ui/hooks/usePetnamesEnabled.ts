import { useStore } from 'react-redux';
import { getPetnamesEnabled } from '../selectors';

export function usePetnamesEnabled(): boolean {
  return getPetnamesEnabled(useStore().getState());
}
