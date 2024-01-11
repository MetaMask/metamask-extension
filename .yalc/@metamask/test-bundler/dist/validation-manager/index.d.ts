import type { JsonRpcProvider } from '@ethersproject/providers';
import type { ValidateUserOpResult } from './ValidationManager';
import type { UserOperation } from '../utils';
export * from './ValidationManager';
/**
 *
 * @param provider
 */
export declare function supportsDebugTraceCall(provider: JsonRpcProvider): Promise<boolean>;
/**
 *
 * @param provider
 * @param userOperation
 * @param entryPointAddress
 */
export declare function checkRulesViolations(provider: JsonRpcProvider, userOperation: UserOperation, entryPointAddress: string): Promise<ValidateUserOpResult>;
