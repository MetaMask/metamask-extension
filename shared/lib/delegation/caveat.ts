import type { Hex } from '@metamask/utils';
import { Caveat as CoreCaveatStruct } from '@metamask/delegation-core';

/**
 * Represents a CaveatStruct as defined in the Delegation Framework.
 * This uses Hex strings for all byte fields for consistency within MetaMask Extension.
 *
 * This type is based on CaveatStruct from @metamask/delegation-core but
 * constrains all byte fields to Hex strings.
 */
export type Caveat = CoreCaveatStruct<Hex>;
