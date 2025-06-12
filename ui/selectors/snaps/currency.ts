import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';

export const getMemoizedCurrentCurrency = createDeepEqualSelector(
  [getCurrentCurrency],
  (currency) => currency,
);
