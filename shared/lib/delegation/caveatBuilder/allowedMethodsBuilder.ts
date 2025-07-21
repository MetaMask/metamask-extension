import type { Hex } from '../utils';
import { concat, isHex, toFunctionSelector } from '../utils';
import type { Caveat, DeleGatorEnvironment } from '..';

export const allowedMethods = 'allowedMethods';

export type MethodSelector = Hex | string;

// length of function selector in chars, _including_ 0x prefix
const FUNCTION_SELECTOR_STRING_LENGTH = 10;

/**
 * Builds a caveat struct for the AllowedMethodsEnforcer.
 *
 * @param environment - The DeleGator environment.
 * @param selectors - The allowed function selectors.
 * @returns The Caveat.
 * @throws Error if no selectors are provided or if any selector is invalid.
 */
export const allowedMethodsBuilder = (
  environment: DeleGatorEnvironment,
  selectors: MethodSelector[],
): Caveat => {
  if (selectors.length === 0) {
    throw new Error('Invalid selectors: must provide at least one selector');
  }

  const parsedSelectors = selectors.map(parseSelector);

  const terms = concat(parsedSelectors);

  const {
    caveatEnforcers: { AllowedMethodsEnforcer },
  } = environment;

  return {
    enforcer: AllowedMethodsEnforcer,
    terms,
    args: '0x',
  };
};

function parseSelector(selector: MethodSelector) {
  if (isHex(selector)) {
    if (selector.length === FUNCTION_SELECTOR_STRING_LENGTH) {
      return selector;
    }
    throw new Error(
      'Invalid selector: must be a 4 byte hex string or abi function signature',
    );
  }

  try {
    return toFunctionSelector(selector);
  } catch (rootError: unknown) {
    throw new Error(
      'Invalid selector: must be a 4 byte hex string or abi function signature',
      { cause: rootError },
    );
  }
}
