import { ExecutionManager } from './ExecutionManager';
import { ReputationManager } from './ReputationManager';
import { MempoolManager } from './MempoolManager';
import { Signer } from 'ethers';
import { BundlerConfig } from '../BundlerConfig';
import { EventsManager } from './EventsManager';
/**
 * initialize server modules.
 * returns the ExecutionManager and EventsManager (for handling events, to update reputation)
 * @param config
 * @param signer
 */
export declare function initServer(config: BundlerConfig, signer: Signer): [ExecutionManager, EventsManager, ReputationManager, MempoolManager];
