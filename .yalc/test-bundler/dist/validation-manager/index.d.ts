import { JsonRpcProvider } from '@ethersproject/providers';
import { UserOperation } from '../utils';
import { ValidateUserOpResult } from './ValidationManager';
export * from './ValidationManager';
export declare function supportsDebugTraceCall(provider: JsonRpcProvider): Promise<boolean>;
export declare function checkRulesViolations(provider: JsonRpcProvider, userOperation: UserOperation, entryPointAddress: string): Promise<ValidateUserOpResult>;
