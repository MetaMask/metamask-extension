import { v4 as uuid } from 'uuid';
import log from 'loglevel';
import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  StateMetadata,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import type { Json } from '@metamask/utils';

// ============================================================================
// Types
// ============================================================================

export type AgentConfig = {
  id: string;
  name: string;
  publicKey: string;
  permissions: AgentPermissions;
  createdAt: number;
  lastUsed: number;
  active: boolean;
};

export type AgentPermissions = {
  spendLimit: {
    daily: string; // USD value in 6 decimals (e.g., "50000000" = $50)
    perTx: string;
  };
  allowedChains: number[];
  allowedProtocols: string[]; // Contract addresses
  allowedMethods: string[]; // Function selectors or '*'
  blockedMethods: string[];
  requireApproval: {
    above: string; // USD threshold
    methods: string[]; // Methods that always need approval
  };
  expiresAt: number | null;
};

export type AgentRequest = {
  type: 'CONNECT' | 'SEND_TX' | 'SIGN_MESSAGE' | 'SIGN_TYPED_DATA' | 'SWITCH_CHAIN' | 'GET_ACCOUNTS';
  requestId: string;
  agentId: string;
  signature: string;
  timestamp: number;
  payload: Json;
};

export type AgentResponse = {
  requestId: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING_APPROVAL' | 'ERROR';
  result?: Json;
  error?: string;
};

export type PendingApproval = {
  id: string;
  agentId: string;
  requestId: string;
  txDetails: TransactionDetails;
  createdAt: number;
  expiresAt: number;
};

export type TransactionDetails = {
  to: string;
  value: string;
  data: string;
  chainId: number;
  from?: string;
  gasLimit?: string;
  decodedMethod?: string;
  estimatedUsdValue?: string;
};

export type AgentActivity = {
  id: string;
  agentId: string;
  action: string;
  details: Json;
  timestamp: number;
};

// ============================================================================
// State
// ============================================================================

export type AgentControllerState = {
  agents: Record<string, AgentConfig>;
  pendingApprovals: Record<string, PendingApproval>;
  dailySpend: Record<string, string>; // agentId -> spent today (USD 6 decimals)
  activityLog: AgentActivity[];
  lastDailyReset: number;
};

const controllerName = 'AgentController';

const getDefaultAgentControllerState = (): AgentControllerState => ({
  agents: {},
  pendingApprovals: {},
  dailySpend: {},
  activityLog: [],
  lastDailyReset: Date.now(),
});

const controllerMetadata: StateMetadata<AgentControllerState> = {
  agents: {
    persist: true,
    anonymous: false,
  },
  pendingApprovals: {
    persist: false,
    anonymous: false,
  },
  dailySpend: {
    persist: true,
    anonymous: false,
  },
  activityLog: {
    persist: true,
    anonymous: false,
  },
  lastDailyReset: {
    persist: true,
    anonymous: false,
  },
};

// ============================================================================
// Actions & Events
// ============================================================================

export type AgentControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  AgentControllerState
>;

export type AgentControllerRegisterAgentAction = {
  type: 'AgentController:registerAgent';
  handler: AgentController['registerAgent'];
};

export type AgentControllerRevokeAgentAction = {
  type: 'AgentController:revokeAgent';
  handler: AgentController['revokeAgent'];
};

export type AgentControllerHandleRequestAction = {
  type: 'AgentController:handleRequest';
  handler: AgentController['handleRequest'];
};

export type AgentControllerActions =
  | AgentControllerGetStateAction
  | AgentControllerRegisterAgentAction
  | AgentControllerRevokeAgentAction
  | AgentControllerHandleRequestAction;

export type AgentControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  AgentControllerState
>;

export type AgentControllerApprovalRequiredEvent = {
  type: 'AgentController:approvalRequired';
  payload: [PendingApproval];
};

export type AgentControllerEvents =
  | AgentControllerStateChangeEvent
  | AgentControllerApprovalRequiredEvent;

export type AgentControllerMessenger = Messenger<
  typeof controllerName,
  AgentControllerActions,
  AgentControllerEvents
>;

// ============================================================================
// Default Permissions
// ============================================================================

const DEFAULT_PERMISSIONS: AgentPermissions = {
  spendLimit: {
    daily: '0',
    perTx: '0',
  },
  allowedChains: [],
  allowedProtocols: [],
  allowedMethods: [],
  blockedMethods: ['0x095ea7b3'], // approve(address,uint256)
  requireApproval: {
    above: '0',
    methods: ['multicall', 'execute', 'permitTransferFrom'],
  },
  expiresAt: null,
};

// Known method selectors
const KNOWN_METHODS: Record<string, string> = {
  '0x095ea7b3': 'approve(address,uint256)',
  '0xa9059cbb': 'transfer(address,uint256)',
  '0x23b872dd': 'transferFrom(address,address,uint256)',
  '0x38ed1739': 'swapExactTokensForTokens',
  '0x7ff36ab5': 'swapExactETHForTokens',
  '0x5ae401dc': 'multicall(uint256,bytes[])',
  '0x3593564c': 'execute(bytes,bytes[],uint256)',
};

// ============================================================================
// Controller
// ============================================================================

export type AgentControllerOptions = {
  messenger: AgentControllerMessenger;
  state?: Partial<AgentControllerState>;
};

export class AgentController extends BaseController<
  typeof controllerName,
  AgentControllerState,
  AgentControllerMessenger
> {
  constructor({ messenger, state = {} }: AgentControllerOptions) {
    super({
      name: controllerName,
      metadata: controllerMetadata,
      state: {
        ...getDefaultAgentControllerState(),
        ...state,
      },
      messenger,
    });

    // Register action handlers
    this.messagingSystem.registerActionHandler(
      'AgentController:registerAgent',
      this.registerAgent.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      'AgentController:revokeAgent',
      this.revokeAgent.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      'AgentController:handleRequest',
      this.handleRequest.bind(this),
    );

    // Check for daily reset
    this.#checkDailyReset();
  }

  // === Agent Management ===

  registerAgent(
    name: string,
    publicKey: string,
    permissions: Partial<AgentPermissions> = {},
  ): AgentConfig {
    const id = uuid();
    const agent: AgentConfig = {
      id,
      name,
      publicKey,
      permissions: { ...DEFAULT_PERMISSIONS, ...permissions },
      createdAt: Date.now(),
      lastUsed: Date.now(),
      active: true,
    };

    this.update((state) => {
      state.agents[id] = agent;
    });

    this.#logActivity(id, 'REGISTERED', { name });
    log.info(`[AgentController] Registered agent: ${name} (${id})`);

    return agent;
  }

  updateAgentPermissions(
    agentId: string,
    permissions: Partial<AgentPermissions>,
  ): void {
    const agent = this.state.agents[agentId];
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    this.update((state) => {
      state.agents[agentId].permissions = {
        ...state.agents[agentId].permissions,
        ...permissions,
      };
    });

    this.#logActivity(agentId, 'PERMISSIONS_UPDATED', permissions);
  }

  revokeAgent(agentId: string): void {
    const agent = this.state.agents[agentId];
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    this.update((state) => {
      state.agents[agentId].active = false;
      // Remove pending approvals for this agent
      for (const [id, approval] of Object.entries(state.pendingApprovals)) {
        if (approval.agentId === agentId) {
          delete state.pendingApprovals[id];
        }
      }
    });

    this.#logActivity(agentId, 'REVOKED', {});
    log.info(`[AgentController] Revoked agent: ${agentId}`);
  }

  deleteAgent(agentId: string): void {
    this.update((state) => {
      delete state.agents[agentId];
      delete state.dailySpend[agentId];
    });

    log.info(`[AgentController] Deleted agent: ${agentId}`);
  }

  // === Request Handling ===

  async handleRequest(request: AgentRequest): Promise<AgentResponse> {
    const { agentId, requestId, type, payload, signature, timestamp } = request;

    // Validate agent
    const agent = this.state.agents[agentId];
    if (!agent) {
      return { requestId, status: 'ERROR', error: 'Agent not found' };
    }

    if (!agent.active) {
      return { requestId, status: 'ERROR', error: 'Agent has been revoked' };
    }

    // Validate signature (simplified - implement actual verification)
    if (!this.#verifySignature(request, agent.publicKey)) {
      this.#logActivity(agentId, 'INVALID_SIGNATURE', { requestId });
      return { requestId, status: 'ERROR', error: 'Invalid signature' };
    }

    // Check expiration
    if (agent.permissions.expiresAt && Date.now() > agent.permissions.expiresAt) {
      return { requestId, status: 'ERROR', error: 'Agent permissions expired' };
    }

    // Update last used
    this.update((state) => {
      state.agents[agentId].lastUsed = Date.now();
    });

    // Handle by type
    try {
      switch (type) {
        case 'SEND_TX':
          return await this.#handleSendTransaction(agent, requestId, payload as TransactionDetails);
        case 'GET_ACCOUNTS':
          return { requestId, status: 'APPROVED', result: [] }; // Would return actual accounts
        default:
          return { requestId, status: 'ERROR', error: `Unknown request type: ${type}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.#logActivity(agentId, 'ERROR', { requestId, error: errorMessage });
      return { requestId, status: 'ERROR', error: errorMessage };
    }
  }

  // === Transaction Handling ===

  async #handleSendTransaction(
    agent: AgentConfig,
    requestId: string,
    txDetails: TransactionDetails,
  ): Promise<AgentResponse> {
    const { permissions } = agent;
    const { to, value, data, chainId } = txDetails;

    // Check chain
    if (!permissions.allowedChains.includes(chainId)) {
      this.#logActivity(agent.id, 'REJECTED', { requestId, reason: 'chain_not_allowed' });
      return { requestId, status: 'REJECTED', error: 'Chain not in allowlist' };
    }

    // Check protocol
    if (permissions.allowedProtocols.length > 0) {
      const isAllowed = permissions.allowedProtocols.some(
        (p) => p.toLowerCase() === to.toLowerCase(),
      );
      if (!isAllowed) {
        this.#logActivity(agent.id, 'REJECTED', { requestId, reason: 'protocol_not_allowed' });
        return { requestId, status: 'REJECTED', error: 'Protocol not in allowlist' };
      }
    }

    // Check method
    const selector = data?.slice(0, 10) || '0x';
    const decodedMethod = KNOWN_METHODS[selector] || selector;

    if (permissions.blockedMethods.some((m) => decodedMethod.includes(m) || selector === m)) {
      this.#logActivity(agent.id, 'REJECTED', { requestId, reason: 'method_blocked' });
      return { requestId, status: 'REJECTED', error: 'Method is blocked' };
    }

    // Estimate USD value (simplified)
    const estimatedUsd = this.#estimateUsdValue(value, chainId);

    // Check spend limits
    const perTxLimit = BigInt(permissions.spendLimit.perTx);
    if (estimatedUsd > perTxLimit) {
      this.#logActivity(agent.id, 'REJECTED', { requestId, reason: 'exceeds_per_tx_limit' });
      return { requestId, status: 'REJECTED', error: 'Exceeds per-transaction limit' };
    }

    const dailySpent = BigInt(this.state.dailySpend[agent.id] || '0');
    const dailyLimit = BigInt(permissions.spendLimit.daily);
    if (dailySpent + estimatedUsd > dailyLimit) {
      this.#logActivity(agent.id, 'REJECTED', { requestId, reason: 'exceeds_daily_limit' });
      return { requestId, status: 'REJECTED', error: 'Exceeds daily limit' };
    }

    // Check if requires approval
    const approvalThreshold = BigInt(permissions.requireApproval.above);
    const requiresApprovalMethod = permissions.requireApproval.methods.some(
      (m) => decodedMethod.includes(m),
    );

    if (estimatedUsd > approvalThreshold || requiresApprovalMethod) {
      const approval = this.#createPendingApproval(agent, requestId, {
        ...txDetails,
        decodedMethod,
        estimatedUsdValue: estimatedUsd.toString(),
      });

      this.messagingSystem.publish('AgentController:approvalRequired', approval);
      this.#logActivity(agent.id, 'APPROVAL_REQUESTED', { requestId });

      return { requestId, status: 'PENDING_APPROVAL' };
    }

    // Would execute transaction here via TransactionController
    // For now, return success
    this.update((state) => {
      state.dailySpend[agent.id] = (dailySpent + estimatedUsd).toString();
    });

    this.#logActivity(agent.id, 'TX_APPROVED', { requestId });
    return { requestId, status: 'APPROVED', result: { txHash: '0x_placeholder' } };
  }

  // === Approval Management ===

  #createPendingApproval(
    agent: AgentConfig,
    requestId: string,
    txDetails: TransactionDetails,
  ): PendingApproval {
    const approval: PendingApproval = {
      id: uuid(),
      agentId: agent.id,
      requestId,
      txDetails,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    this.update((state) => {
      state.pendingApprovals[approval.id] = approval;
    });

    return approval;
  }

  approveTransaction(approvalId: string): AgentResponse {
    const approval = this.state.pendingApprovals[approvalId];
    if (!approval) {
      return { requestId: '', status: 'ERROR', error: 'Approval not found' };
    }

    if (Date.now() > approval.expiresAt) {
      this.update((state) => {
        delete state.pendingApprovals[approvalId];
      });
      return { requestId: approval.requestId, status: 'ERROR', error: 'Approval expired' };
    }

    // Would execute transaction here
    this.update((state) => {
      delete state.pendingApprovals[approvalId];
    });

    this.#logActivity(approval.agentId, 'TX_APPROVED_BY_USER', { approvalId });
    return { requestId: approval.requestId, status: 'APPROVED', result: { txHash: '0x_placeholder' } };
  }

  rejectApproval(approvalId: string): AgentResponse {
    const approval = this.state.pendingApprovals[approvalId];
    if (!approval) {
      return { requestId: '', status: 'ERROR', error: 'Approval not found' };
    }

    this.update((state) => {
      delete state.pendingApprovals[approvalId];
    });

    this.#logActivity(approval.agentId, 'TX_REJECTED_BY_USER', { approvalId });
    return { requestId: approval.requestId, status: 'REJECTED', error: 'User rejected' };
  }

  getPendingApprovals(): PendingApproval[] {
    // Clean expired
    const now = Date.now();
    const valid: PendingApproval[] = [];

    for (const approval of Object.values(this.state.pendingApprovals)) {
      if (now <= approval.expiresAt) {
        valid.push(approval);
      }
    }

    return valid;
  }

  // === Helpers ===

  #verifySignature(_request: AgentRequest, _publicKey: string): boolean {
    // TODO: Implement actual signature verification
    return true;
  }

  #estimateUsdValue(value: string, _chainId: number): bigint {
    // Simplified: assume ETH at $2500
    // Real implementation would use price feeds
    const ethPrice = 2500n;
    const weiValue = BigInt(value || '0');
    const ethValue = weiValue / BigInt(1e18);
    return ethValue * ethPrice * BigInt(1e6); // 6 decimal USD
  }

  #logActivity(agentId: string, action: string, details: Json): void {
    const activity: AgentActivity = {
      id: uuid(),
      agentId,
      action,
      details,
      timestamp: Date.now(),
    };

    this.update((state) => {
      state.activityLog.push(activity);
      // Keep last 500 entries
      if (state.activityLog.length > 500) {
        state.activityLog = state.activityLog.slice(-500);
      }
    });
  }

  #checkDailyReset(): void {
    const now = Date.now();
    const lastReset = this.state.lastDailyReset;
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (now - lastReset > oneDayMs) {
      this.update((state) => {
        state.dailySpend = {};
        state.lastDailyReset = now;
      });
      log.info('[AgentController] Daily spend reset');
    }
  }

  getActivityLog(agentId?: string, limit = 100): AgentActivity[] {
    let activities = this.state.activityLog;
    if (agentId) {
      activities = activities.filter((a) => a.agentId === agentId);
    }
    return activities.slice(-limit);
  }
}
