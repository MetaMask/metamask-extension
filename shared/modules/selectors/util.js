import { isEqual } from 'lodash';
import { createSelectorCreator, lruMemoize } from 'reselect';

export const createDeepEqualSelector = createSelectorCreator(
  lruMemoize,
  isEqual,
);
