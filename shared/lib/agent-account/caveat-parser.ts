import type { Hex } from '@metamask/utils';
import type { CaveatConfig, CaveatType } from '../../types/agent-account';
import type { Caveat, DeleGatorEnvironment } from '../delegation';
import {
  createCaveatBuilder,
  type CoreCaveatBuilder,
} from '../delegation/caveatBuilder';

/**
 * Error thrown when caveat parsing fails
 */
export class CaveatParserError extends Error {
  constructor(
    message: string,
    public readonly caveatType?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'CaveatParserError';
  }
}

/**
 * Validates that a value is a valid Ethereum address
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @returns The validated address as Hex
 */
function validateAddress(value: unknown, fieldName: string): Hex {
  if (typeof value !== 'string') {
    throw new CaveatParserError(
      `${fieldName} must be a string, got ${typeof value}`,
    );
  }

  if (!/^0x[a-fA-F0-9]{40}$/u.test(value)) {
    throw new CaveatParserError(
      `${fieldName} must be a valid Ethereum address (40 hex chars with 0x prefix)`,
    );
  }

  return value as Hex;
}

/**
 * Validates that a value is a valid amount string (can be parsed as bigint)
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @returns The validated amount as bigint
 */
function validateAmount(value: unknown, fieldName: string): bigint {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 0) {
      throw new CaveatParserError(
        `${fieldName} must be a non-negative integer`,
      );
    }
    return BigInt(value);
  }

  if (typeof value === 'string') {
    try {
      const amount = BigInt(value);
      if (amount < 0n) {
        throw new CaveatParserError(`${fieldName} must be non-negative`);
      }
      return amount;
    } catch {
      throw new CaveatParserError(
        `${fieldName} must be a valid integer string`,
      );
    }
  }

  throw new CaveatParserError(
    `${fieldName} must be a string, number, or bigint`,
  );
}

/**
 * Validates that a value is a boolean
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @returns The validated boolean
 */
function validateBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new CaveatParserError(
      `${fieldName} must be a boolean, got ${typeof value}`,
    );
  }
  return value;
}

/**
 * Validates that a value is a positive integer
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @returns The validated number
 */
function validatePositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new CaveatParserError(
      `${fieldName} must be a positive integer, got ${value}`,
    );
  }
  return value;
}

/**
 * Validates that a value is a non-empty array
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @returns The validated array
 */
function validateNonEmptyArray<T>(value: unknown, fieldName: string): T[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new CaveatParserError(
      `${fieldName} must be a non-empty array`,
    );
  }
  return value as T[];
}

/**
 * Parses an allowedMethods caveat config
 */
function parseAllowedMethods(
  builder: CoreCaveatBuilder,
  params: Record<string, unknown>,
): CoreCaveatBuilder {
  const selectors = validateNonEmptyArray<string>(params.selectors, 'selectors');

  // Validate each selector is either a 4-byte hex or a function signature
  for (const selector of selectors) {
    if (typeof selector !== 'string') {
      throw new CaveatParserError(
        'Each selector must be a string (4-byte hex or function signature)',
        'allowedMethods',
      );
    }
  }

  return builder.addCaveat('allowedMethods', selectors);
}

/**
 * Parses an allowedTargets caveat config
 */
function parseAllowedTargets(
  builder: CoreCaveatBuilder,
  params: Record<string, unknown>,
): CoreCaveatBuilder {
  const targets = validateNonEmptyArray<string>(params.targets, 'targets');
  const validatedTargets = targets.map((t, i) =>
    validateAddress(t, `targets[${i}]`),
  );

  return builder.addCaveat('allowedTargets', validatedTargets);
}

/**
 * Parses an erc20BalanceChange caveat config
 */
function parseErc20BalanceChange(
  builder: CoreCaveatBuilder,
  params: Record<string, unknown>,
): CoreCaveatBuilder {
  const enforceDecrease = validateBoolean(
    params.enforceDecrease,
    'enforceDecrease',
  );
  const token = validateAddress(params.token, 'token');
  const recipient = validateAddress(params.recipient, 'recipient');
  const amount = validateAmount(params.amount, 'amount');

  return builder.addCaveat(
    'erc20BalanceChange',
    enforceDecrease,
    token,
    recipient,
    amount,
  );
}

/**
 * Parses a nativeBalanceChange caveat config
 */
function parseNativeBalanceChange(
  builder: CoreCaveatBuilder,
  params: Record<string, unknown>,
): CoreCaveatBuilder {
  const enforceDecrease = validateBoolean(
    params.enforceDecrease,
    'enforceDecrease',
  );
  const recipient = validateAddress(params.recipient, 'recipient');
  const amount = validateAmount(params.amount, 'amount');

  return builder.addCaveat(
    'nativeBalanceChange',
    enforceDecrease,
    recipient,
    amount,
  );
}

/**
 * Parses a limitedCalls caveat config
 */
function parseLimitedCalls(
  builder: CoreCaveatBuilder,
  params: Record<string, unknown>,
): CoreCaveatBuilder {
  const count = validatePositiveInteger(params.count, 'count');

  return builder.addCaveat('limitedCalls', count);
}

/**
 * Parses a redeemer caveat config
 */
function parseRedeemer(
  builder: CoreCaveatBuilder,
  params: Record<string, unknown>,
): CoreCaveatBuilder {
  const redeemers = validateNonEmptyArray<string>(params.redeemers, 'redeemers');
  const validatedRedeemers = redeemers.map((r, i) =>
    validateAddress(r, `redeemers[${i}]`),
  );

  return builder.addCaveat('redeemer', validatedRedeemers);
}

/**
 * Supported caveat type parsers
 */
const CAVEAT_PARSERS: Record<
  CaveatType,
  (builder: CoreCaveatBuilder, params: Record<string, unknown>) => CoreCaveatBuilder
> = {
  allowedMethods: parseAllowedMethods,
  allowedTargets: parseAllowedTargets,
  erc20BalanceChange: parseErc20BalanceChange,
  nativeBalanceChange: parseNativeBalanceChange,
  limitedCalls: parseLimitedCalls,
  redeemer: parseRedeemer,
  // The following are supported by the framework but not yet implemented in the parser
  // They can be added as needed
  allowedCalldata: () => {
    throw new CaveatParserError(
      'allowedCalldata caveat is not yet supported by the parser',
      'allowedCalldata',
    );
  },
  erc721BalanceChange: () => {
    throw new CaveatParserError(
      'erc721BalanceChange caveat is not yet supported by the parser',
      'erc721BalanceChange',
    );
  },
  erc1155BalanceChange: () => {
    throw new CaveatParserError(
      'erc1155BalanceChange caveat is not yet supported by the parser',
      'erc1155BalanceChange',
    );
  },
  timestamp: () => {
    throw new CaveatParserError(
      'timestamp caveat is not yet supported by the parser',
      'timestamp',
    );
  },
  exactExecution: () => {
    throw new CaveatParserError(
      'exactExecution caveat is not yet supported by the parser',
      'exactExecution',
    );
  },
};

/**
 * Validates a caveat configuration
 *
 * @param config - The caveat configuration to validate
 * @returns True if valid, throws otherwise
 */
export function validateCaveatConfig(config: CaveatConfig): boolean {
  if (!config || typeof config !== 'object') {
    throw new CaveatParserError('Caveat config must be an object');
  }

  if (!config.type || typeof config.type !== 'string') {
    throw new CaveatParserError('Caveat config must have a string "type" field');
  }

  if (!(config.type in CAVEAT_PARSERS)) {
    throw new CaveatParserError(
      `Unknown caveat type: ${config.type}`,
      config.type,
    );
  }

  if (!config.params || typeof config.params !== 'object') {
    throw new CaveatParserError(
      'Caveat config must have an object "params" field',
      config.type,
    );
  }

  return true;
}

/**
 * Parses an array of LLM-generated caveat configurations into Caveat objects
 *
 * @param configs - Array of caveat configurations from the LLM
 * @param environment - The DeleGator environment with enforcer addresses
 * @returns Array of Caveat objects
 */
export function parseLLMResponseToCaveats(
  configs: CaveatConfig[],
  environment: DeleGatorEnvironment,
): Caveat[] {
  // Handle empty caveats array (full authority)
  if (configs.length === 0) {
    return [];
  }

  // Validate all configs first
  for (const config of configs) {
    validateCaveatConfig(config);
  }

  // Create a caveat builder with allowEmptyCaveats = true
  // (we handle empty separately above)
  let builder = createCaveatBuilder(environment, { allowEmptyCaveats: true });

  // Parse each config and add to builder
  for (const config of configs) {
    const parser = CAVEAT_PARSERS[config.type];
    try {
      builder = parser(builder, config.params) as CoreCaveatBuilder;
    } catch (error) {
      if (error instanceof CaveatParserError) {
        throw error;
      }
      throw new CaveatParserError(
        `Failed to parse caveat: ${error instanceof Error ? error.message : 'Unknown error'}`,
        config.type,
        config.params,
      );
    }
  }

  return builder.build();
}

/**
 * Gets a human-readable description of a caveat type
 *
 * @param type - The caveat type
 * @returns Human-readable description
 */
export function getCaveatTypeDescription(type: CaveatType): string {
  const descriptions: Record<CaveatType, string> = {
    allowedMethods: 'Restricts which contract methods can be called',
    allowedTargets: 'Restricts which contract addresses can be interacted with',
    allowedCalldata: 'Restricts the calldata that can be sent',
    erc20BalanceChange: 'Limits ERC20 token transfers',
    erc721BalanceChange: 'Limits ERC721 NFT transfers',
    erc1155BalanceChange: 'Limits ERC1155 token transfers',
    nativeBalanceChange: 'Limits native token (ETH) transfers',
    limitedCalls: 'Limits the total number of times this delegation can be used',
    timestamp: 'Limits the delegation to a specific time window',
    redeemer: 'Restricts who can use this delegation',
    exactExecution: 'Requires exact match of target, value, and calldata',
  };

  return descriptions[type] || 'Unknown caveat type';
}
