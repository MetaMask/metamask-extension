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
  KeyringControllerVerifyPasswordAction,
} from '@metamask/keyring-controller';
import type { PerpsControllerPrepareTradingWalletAction } from '@metamask/perps-controller';
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

export type PerpsAgentWalletControllerGetAgentSignerAction = {
  type: 'PerpsAgentWalletController:getAgentSigner';
  handler: PerpsAgentWalletController['getAgentSigner'];
};

export type PerpsAgentWalletControllerCanSetupAgentWalletAction = {
  type: 'PerpsAgentWalletController:canSetupAgentWallet';
  handler: PerpsAgentWalletController['canSetupAgentWallet'];
};

export type PerpsAgentWalletControllerOnUnlockAction = {
  type: 'PerpsAgentWalletController:onUnlock';
  handler: PerpsAgentWalletController['onUnlock'];
};

export type PerpsAgentWalletControllerOnPasswordChangeAction = {
  type: 'PerpsAgentWalletController:onPasswordChange';
  handler: PerpsAgentWalletController['onPasswordChange'];
};

export type PerpsAgentWalletControllerOnInaccessibleKeysAction = {
  type: 'PerpsAgentWalletController:onInaccessibleKeys';
  handler: PerpsAgentWalletController['onInaccessibleKeys'];
};

// The setup lifecycle methods (`beginSetup`, `completeSetup`, `failSetup`)
// and `onLock` are deliberately NOT messenger actions: they are internal to
// the controller (`agent-setup-flow.ts` and the lock subscription call the
// controller instance directly), so they stay off the external surface.
export type PerpsAgentWalletControllerActions =
  | PerpsAgentWalletControllerGetStateAction
  | PerpsAgentWalletControllerGetActiveAgentAction
  | PerpsAgentWalletControllerGetAgentSignerAction
  | PerpsAgentWalletControllerCanSetupAgentWalletAction
  | PerpsAgentWalletControllerOnUnlockAction
  | PerpsAgentWalletControllerOnPasswordChangeAction
  | PerpsAgentWalletControllerOnInaccessibleKeysAction;

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
// keyring access is possible-but-observable; the controller never registers
// agent keys as keyring accounts. Two actions are used deliberately by the
// setup flow (`agent-setup-flow.ts`): `signTypedMessage` (the MASTER account
// signs the approveAgent typed data) and `verifyPassword` (the password gates
// encryption of the agent key).
// The PerpsController allowance is used deliberately by the setup flow to run
// the trading-readiness steps (unified account enablement, builder fee
// approval) right after activation, so hardware wallet users give every
// master signature in one guided session instead of being re-prompted on
// their first order.
export type PerpsAgentWalletControllerAllowedActions =
  | PerpsAgentWalletControllerActions
  | KeyringControllerAddNewKeyringAction
  | KeyringControllerGetKeyringsByTypeAction
  | KeyringControllerGetStateAction
  | KeyringControllerSignTypedMessageAction
  | KeyringControllerVerifyPasswordAction
  | PerpsControllerPrepareTradingWalletAction;

export type PerpsAgentWalletControllerAllowedEvents =
  | PerpsAgentWalletControllerEvents
  | KeyringControllerLockEvent;

export type PerpsAgentWalletControllerMessenger = Messenger<
  'PerpsAgentWalletController',
  PerpsAgentWalletControllerAllowedActions,
  PerpsAgentWalletControllerAllowedEvents
>;
