import { createDeepEqualSelector } from '../../../shared/lib/selectors/util';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';

export const getMemoizedCurrentCurrency = createDeepEqualSelector(
  [getCurrentCurrency],
  (currency) => currency,
);
