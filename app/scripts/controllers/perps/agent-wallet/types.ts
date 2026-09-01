import type {
  ControllerGetStateAction,
  ControllerStateChangedEvent,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import type {
  KeyringControllerAddNewKeyringAction,
  KeyringControllerGetKeyringsByTypeAction,
  KeyringControllerGetStateAction,
  KeyringControllerLockEvent,
  KeyringControllerSignTypedMessageAction,
} from '@metamask/keyring-controller';
import type { PerpsAgentWalletController } from './perps-agent-wallet-controller';

/** Registration metadata for a perps agent wallet, keyed by master account. */
export type AgentRegistration = {
  agentAddress: `0x${string}`;
  agentName: string;
  masterAccountAddress: string;
  createdAt: number;
};

export type PerpsAgentWalletSetupStatus =
  | 'idle'
  | 'generating'
  | 'awaiting-approval'
  | 'submitting'
  | 'active'
  | 'failed';

export type PerpsAgentWalletControllerState = {
  /** Completed agent registrations by master account address. */
  agentsByAccount: Record<string, AgentRegistration>;
  /** Transient setup lifecycle status by master account address (not persisted). */
  setupStatusByAccount: Record<string, PerpsAgentWalletSetupStatus>;
  /** Password-encrypted agent private keys by master account address (ciphertext only). */
  agentKeyVaultByAccount: Record<string, string>;
};

/** Local signer built from the in-memory agent key while the wallet is unlocked. */
export type PerpsAgentSigner = {
  address: `0x${string}`;
  signTypedData(
    domain: unknown,
    types: unknown,
    value: unknown,
  ): Promise<string>;
};

export type PerpsAgentWalletControllerGetStateAction = ControllerGetStateAction<
  'PerpsAgentWalletController',
  PerpsAgentWalletControllerState
>;

export type PerpsAgentWalletControllerGetActiveAgentAction = {
  type: 'PerpsAgentWalletController:getActiveAgent';
  handler: PerpsAgentWalletController['getActiveAgent'];
};

export type PerpsAgentWalletControllerBeginSetupAction = {
  type: 'PerpsAgentWalletController:beginSetup';
  handler: PerpsAgentWalletController['beginSetup'];
};

export type PerpsAgentWalletControllerCompleteSetupAction = {
  type: 'PerpsAgentWalletController:completeSetup';
  handler: PerpsAgentWalletController['completeSetup'];
};

export type PerpsAgentWalletControllerFailSetupAction = {
  type: 'PerpsAgentWalletController:failSetup';
  handler: PerpsAgentWalletController['failSetup'];
};

export type PerpsAgentWalletControllerOnUnlockAction = {
  type: 'PerpsAgentWalletController:onUnlock';
  handler: PerpsAgentWalletController['onUnlock'];
};

export type PerpsAgentWalletControllerOnPasswordChangeAction = {
  type: 'PerpsAgentWalletController:onPasswordChange';
  handler: PerpsAgentWalletController['onPasswordChange'];
};

export type PerpsAgentWalletControllerOnLockAction = {
  type: 'PerpsAgentWalletController:onLock';
  handler: PerpsAgentWalletController['onLock'];
};

export type PerpsAgentWalletControllerActions =
  | PerpsAgentWalletControllerGetStateAction
  | PerpsAgentWalletControllerGetActiveAgentAction
  | PerpsAgentWalletControllerBeginSetupAction
  | PerpsAgentWalletControllerCompleteSetupAction
  | PerpsAgentWalletControllerFailSetupAction
  | PerpsAgentWalletControllerOnUnlockAction
  | PerpsAgentWalletControllerOnPasswordChangeAction
  | PerpsAgentWalletControllerOnLockAction;

export type PerpsAgentWalletControllerAgentActivatedEvent = {
  type: 'PerpsAgentWalletController:agentActivated';
  payload: [
    {
      masterAccountAddress: string;
      agentAddress: `0x${string}`;
    },
  ];
};

export type PerpsAgentWalletControllerStateChangeEvent =
  ControllerStateChangedEvent<
    'PerpsAgentWalletController',
    PerpsAgentWalletControllerState
  >;

export type PerpsAgentWalletControllerEvents =
  | PerpsAgentWalletControllerStateChangeEvent
  | PerpsAgentWalletControllerAgentActivatedEvent;

// Allowances for KeyringController actions exist so that any accidental
// keyring access is possible-but-observable (and covered by tests asserting
// zero keyring calls); the controller never registers agent keys as keyring
// accounts.
export type PerpsAgentWalletControllerAllowedActions =
  | PerpsAgentWalletControllerActions
  | KeyringControllerAddNewKeyringAction
  | KeyringControllerGetKeyringsByTypeAction
  | KeyringControllerGetStateAction
  | KeyringControllerSignTypedMessageAction;

export type PerpsAgentWalletControllerAllowedEvents =
  | PerpsAgentWalletControllerEvents
  | KeyringControllerLockEvent;

export type PerpsAgentWalletControllerMessenger = Messenger<
  'PerpsAgentWalletController',
  PerpsAgentWalletControllerAllowedActions,
  PerpsAgentWalletControllerAllowedEvents
>;
