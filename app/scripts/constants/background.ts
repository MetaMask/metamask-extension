import { RPC_VALIDATION_PORT } from '../../../shared/lib/rpc-endpoint-validation';

export const BLOCKED_PORTS = ['trezor-connect', RPC_VALIDATION_PORT];

// See: https://consensyssoftware.atlassian.net/browse/WPC-1012
export const BLOCKED_HOSTNAMES = [
  'execution.metamask.io',
  'execution.consensys.io',
];
