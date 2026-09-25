// Duplex from readable-stream matches ExtensionPortStream / CAIP substreams.
import type { Duplex } from 'readable-stream';
import type { Runtime } from 'webextension-polyfill';
import type { PreinstalledSnap } from '@metamask/snaps-controllers';
import type MetamaskController from './metamask-controller';

export type MetaMaskControllerInstance = InstanceType<
  typeof MetamaskController
>;

export type BackgroundInitializationState = {
  recoverInProgress: boolean;
  hasVaultAtStartup: number | null;
};

export type StateMetadata = {
  version: number;
};

export type ConnectRemotePortHandler = (
  remotePort: Runtime.Port,
  removeCriticalErrorListeners?: () => void,
) => void;

export type ConnectExternallyConnectableHandler = (
  remotePort: Runtime.Port,
) => void;

export type UntrustedCommunicationRequest = {
  connectionStream: Duplex;
  sender: Runtime.MessageSender | undefined;
  subjectType?: string;
};

export type ConnectUntrustedStreamHandler = (
  connectionStream: Duplex,
  sender: Runtime.MessageSender | undefined,
) => void;

export type SetupTrustedCommunicationSender = Parameters<
  MetaMaskControllerInstance['setupTrustedCommunication']
>[1];

export type PreinstalledSnapsList = PreinstalledSnap[];

/** Derived from the controller instance; replace with stricter typing when `metamask-controller` is TS. */
export type MetaMaskControllerStore = Pick<
  MetaMaskControllerInstance,
  'memStore'
>;

export type { Backup } from '../../shared/lib/stores/persistence-manager';
