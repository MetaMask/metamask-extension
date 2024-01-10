import { IEntryPoint } from '@account-abstraction/contracts';
import { BundlerTracerResult } from './BundlerCollectorTracer';
import { StorageMap, UserOperation } from '../utils';
import { ValidationResult } from './ValidationManager';
/**
 * parse collected simulation traces and revert if they break our rules
 * @param userOp the userOperation that was used in this simulation
 * @param tracerResults the tracer return value
 * @param validationResult output from simulateValidation
 * @param entryPoint the entryPoint that hosted the "simulatedValidation" traced call.
 * @return list of contract addresses referenced by this UserOp
 */
export declare function tracerResultParser(userOp: UserOperation, tracerResults: BundlerTracerResult, validationResult: ValidationResult, entryPoint: IEntryPoint): [string[], StorageMap];
