import type { Hex } from '../lib/delegation/utils';
import type { Delegation, Caveat } from '../lib/delegation';

/**
 * Supported LLM providers for agent account permission generation
 */
export type LLMProvider = 'anthropic' | 'openai' | 'custom';

/**
 * Settings for the LLM provider used to generate agent permissions
 */
export interface AgentAccountSettings {
  /** The LLM provider to use */
  llmProvider: LLMProvider;
  /** API key for the LLM provider */
  apiKey: string;
  /** Model identifier (e.g., 'claude-opus-4-5-20250114', 'gpt-4') */
  model: string;
  /** Custom base URL for 'custom' provider or API overrides */
  customBaseUrl?: string;
}

/**
 * Configuration for a single caveat, as returned by the LLM
 */
export interface CaveatConfig {
  /** The type of caveat enforcer */
  type: CaveatType;
  /** Parameters specific to this caveat type */
  params: Record<string, unknown>;
}

/**
 * Supported caveat types that the LLM can generate
 */
export type CaveatType =
  | 'allowedMethods'
  | 'allowedTargets'
  | 'allowedCalldata'
  | 'erc20BalanceChange'
  | 'erc721BalanceChange'
  | 'erc1155BalanceChange'
  | 'nativeBalanceChange'
  | 'limitedCalls'
  | 'timestamp'
  | 'redeemer'
  | 'exactExecution';

/**
 * Response structure from the LLM when generating permissions
 */
export interface LLMPermissionResponse {
  /** Array of caveat configurations to apply */
  caveats: CaveatConfig[];
  /** Human-readable explanation of what the delegation permits */
  explanation: string;
  /** Any warnings or concerns about the interpretation */
  warnings: string[];
}

/**
 * Full trace of the LLM conversation for debugging
 */
export interface LLMChatTrace {
  /** The system prompt sent to the LLM */
  systemPrompt: string;
  /** The user prompt sent to the LLM */
  userPrompt: string;
  /** The raw response text from the LLM (before parsing) */
  rawResponse: string;
  /** Timestamp when the request was made */
  timestamp: number;
  /** Model used for the request */
  model: string;
  /** Provider used for the request */
  provider: LLMProvider;
}

/**
 * Response from callLLM including both parsed response and debug trace
 */
export interface LLMCallResult {
  /** The parsed permission response */
  response: LLMPermissionResponse;
  /** Full conversation trace for debugging */
  trace: LLMChatTrace;
}

/**
 * Request structure for calling the LLM
 */
export interface LLMRequest {
  /** System prompt containing delegation framework documentation */
  systemPrompt: string;
  /** User's natural language description of desired permissions */
  userPrompt: string;
  /** LLM configuration */
  config: AgentAccountSettings;
}

/**
 * Result of creating an agent delegation
 */
export interface AgentDelegationResult {
  /** The signed delegation */
  delegation: Delegation;
  /** Address of the delegate (agent) account */
  delegateAddress: Hex;
  /** Private key for the delegate account (hex encoded, for agent to use) */
  delegatePrivateKey: Hex;
  /** The caveats applied to this delegation */
  caveats: Caveat[];
  /** Human-readable explanation of permissions */
  explanation: string;
  /** Any warnings about the delegation */
  warnings: string[];
  /** Communication channel ID for permission requests (Phase 2) */
  communicationChannelId?: string;
}

/**
 * Parameters for creating an agent delegation
 */
export interface CreateAgentDelegationParams {
  /** Natural language description of what the agent should be able to do */
  userPrompt: string;
  /** Chain ID for the delegation */
  chainId: Hex;
  /** Address of the delegator (user's account) */
  delegatorAddress: Hex;
}

/**
 * Options for generating the agent output document
 */
export interface AgentOutputOptions {
  /** The signed delegation */
  delegation: Delegation;
  /** Address of the delegate account */
  delegateAddress: Hex;
  /** Private key for the delegate account */
  delegatePrivateKey: Hex;
  /** Original natural language prompt from user */
  originalPrompt: string;
  /** Caveats applied to the delegation */
  caveats: Caveat[];
  /** Chain ID */
  chainId: Hex;
  /** Human-readable explanation */
  explanation: string;
  /** Communication channel ID (Phase 2) */
  communicationChannelId?: string;
}

/**
 * Structure of the generated agent output document
 */
export interface AgentOutputDocument {
  /** Complete markdown document */
  markdown: string;
  /** Just the serialized delegation data (for programmatic use) */
  delegationData: Hex;
  /** The delegate private key */
  delegatePrivateKey: Hex;
}

// ============================================
// Phase 2: Communication Channel Types
// ============================================

/**
 * Status of an agent permission request
 */
export type PermissionRequestStatus =
  | 'pending'
  | 'approved'
  | 'denied'
  | 'modified';

/**
 * A permission request from an agent
 */
export interface AgentPermissionRequest {
  /** Unique identifier for the communication channel */
  channelId: string;
  /** Address of the agent requesting permissions */
  agentAddress: Hex;
  /** Unique identifier for this specific request */
  requestId: string;
  /** Natural language description of requested permissions */
  naturalLanguageRequest: string;
  /** Unix timestamp when the request was made */
  timestamp: number;
  /** Current status of the request */
  status: PermissionRequestStatus;
}

/**
 * Response to an agent permission request
 */
export interface AgentPermissionResponse {
  /** ID of the request being responded to */
  requestId: string;
  /** Whether the request was approved or denied */
  status: 'approved' | 'denied';
  /** The new delegation (if approved) */
  delegation?: Delegation;
  /** Modified request text (if user edited the request) */
  modifiedRequest?: string;
  /** Optional message from user to agent */
  userMessage?: string;
}

/**
 * A communication channel between user and agent
 */
export interface CommunicationChannel {
  /** Unique channel identifier */
  id: string;
  /** Address of the agent */
  agentAddress: Hex;
  /** Address of the delegator (user) */
  delegatorAddress: Hex;
  /** Unix timestamp when channel was created */
  createdAt: number;
  /** Webhook URL for push notifications to agent (optional) */
  webhookUrl?: string;
  /** List of pending permission requests */
  pendingRequests: AgentPermissionRequest[];
}

/**
 * State for agent account feature stored in preferences
 */
export interface AgentAccountState {
  /** LLM provider settings */
  settings: AgentAccountSettings;
  /** Active communication channels */
  channels: CommunicationChannel[];
}
