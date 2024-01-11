import type { Signer } from 'ethers';
import { EventsManager } from './EventsManager';
import { ExecutionManager } from './ExecutionManager';
import { MempoolManager } from './MempoolManager';
import { ReputationManager } from './ReputationManager';
import type { BundlerConfig } from '../BundlerConfig';
/**
 * initialize server modules.
 * returns the ExecutionManager and EventsManager (for handling events, to update reputation)
 * @param config
 * @param signer
 */
export declare function initServer(config: BundlerConfig, signer: Signer): [ExecutionManager, EventsManager, ReputationManager, MempoolManager];
