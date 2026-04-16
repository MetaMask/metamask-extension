import { createDeepEqualSelector } from '../../../shared/lib/selectors/selector-creators';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';

export const getMemoizedCurrentCurrency = createDeepEqualSelector(
  [getCurrentCurrency],
  (currency) => currency,
);
