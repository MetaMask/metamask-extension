import type { Expect } from './type-test-utils';
import type {
  ControllerStatePropertiesEnumerated,
  FlattenedBackgroundStateProxy,
} from './background';

/**
 * If this type triggers the following error
 * `Type instantiation is excessively deep and possibly infinite.ts(2589)`
 * it indicates one of the following regarding `ControllerStatePropertiesEnumerated`:
 * 1) One or more properties are missing.
 * 2) One or more properties need to be marked as optional (`?:`).
 * Superfluous properties will trigger an error in `ControllerStatePropertiesEnumerated` itself.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type Test_FlattenedBackgroundStateProxy = Expect<
  FlattenedBackgroundStateProxy,
  { isInitialized: boolean } & ControllerStatePropertiesEnumerated
>;
