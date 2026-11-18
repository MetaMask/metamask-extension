import type { Expect } from './type-test-utils';
import type {
  ControllerStatePropertiesEnumerated,
  ControllerStateTypesMerged,
} from './background';
import type { IsEquivalent } from './type-level-utils';

type Describe_ControllerStatePropertiesEnumerated = [
  /**
   * `ControllerStatePropertiesEnumerated` must stay equivalent to the merged
   * controller state shape used as the source of truth for background state.
   */
  Expect<
    IsEquivalent<
      ControllerStatePropertiesEnumerated,
      ControllerStateTypesMerged
    >
  >,
];
