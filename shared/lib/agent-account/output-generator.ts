import type { Hex } from '@metamask/utils';
import type { AgentOutputOptions, AgentOutputDocument } from '../../types/agent-account';
import { encodeDelegation } from '../delegation';
import { getCaveatTypeDescription } from './caveat-parser';

/**
 * Delegation Framework documentation links
 */
const FRAMEWORK_LINKS = {
  github: 'https://github.com/MetaMask/delegation-framework',
  erc7715: 'https://eips.ethereum.org/EIPS/eip-7715',
  enforcers:
    'https://github.com/MetaMask/delegation-framework/tree/main/src/enforcers',
  metamask: 'https://metamask.io/flask/',
  gatorCli: 'https://github.com/MetaMask/gator-cli',
};

/**
 * Formats an address for display (checksummed with truncation option)
 *
 * @param address - The address to format
 * @param truncate - Whether to truncate the address
 * @returns Formatted address string
 */
function formatAddress(address: Hex, truncate = false): string {
  if (truncate) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return address;
}

/**
 * Formats a caveat for human-readable display
 *
 * @param caveat - The caveat to format
 * @param index - The index of the caveat in the array
 * @returns Formatted caveat string
 */
function formatCaveatForDisplay(
  caveat: { enforcer: Hex; terms: Hex; args: Hex },
  index: number,
): string {
  return `### Caveat ${index + 1}
- **Enforcer Contract**: \`${caveat.enforcer}\`
- **Terms**: \`${caveat.terms.length > 66 ? `${caveat.terms.slice(0, 66)}...` : caveat.terms}\`
- **Args**: \`${caveat.args}\``;
}

/**
 * Generates the permissions section of the output document
 *
 * @param options - The output generation options
 * @returns Formatted permissions markdown
 */
function generatePermissionsSection(options: AgentOutputOptions): string {
  const { caveats, explanation } = options;

  if (caveats.length === 0) {
    return `## Permissions Granted

**WARNING**: This delegation has NO caveats, meaning it grants FULL authority of the delegator to the delegate.
This should only be used in trusted scenarios.

**Explanation**: ${explanation}`;
  }

  const caveatDetails = caveats
    .map((caveat, index) => formatCaveatForDisplay(caveat, index))
    .join('\n\n');

  return `## Permissions Granted

**Explanation**: ${explanation}

### Caveat Summary
This delegation has ${caveats.length} caveat${caveats.length === 1 ? '' : 's'} that restrict what actions the delegate can perform.
All caveats must pass for any action to be allowed (AND logic).

${caveatDetails}`;
}

/**
 * Generates the usage instructions section
 *
 * @param options - The output generation options
 * @returns Formatted usage markdown
 */
function generateUsageSection(options: AgentOutputOptions): string {
  const { delegateAddress, delegatePrivateKey, chainId } = options;

  return `## Using This Delegation

### For Agent Developers

To use this delegation programmatically:

1. **Import the delegation data** from the "Serialized Delegation Data" section below
2. **Sign transactions** using the delegate private key
3. **Construct a redeemDelegations transaction** with your intended execution
4. **Submit to the DelegationManager contract** on chain ${chainId}

### Delegate Account Information

- **Delegate Address**: \`${delegateAddress}\`
- **Delegate Private Key**: \`${delegatePrivateKey}\`

> **IMPORTANT**: Store the private key securely. Anyone with this key can use the delegation within its caveat restrictions.

### Code Example

\`\`\`typescript
import {
  encodeRedeemDelegations,
  Delegation,
  ExecutionMode,
  BATCH_DEFAULT_MODE
} from '@metamask/delegation-framework';

// Parse the delegation from the serialized data
const delegationData = '/* paste serialized delegation here */';

// Decode the delegation
// Note: You'll need to implement decoding or use the raw delegation object

// Create the redemption transaction
const redeemCalldata = encodeRedeemDelegations({
  delegations: [[delegation]], // Array of delegation chains
  modes: [BATCH_DEFAULT_MODE], // Execution modes
  executions: [[
    {
      target: '0x...', // Target contract address
      value: 0n,       // ETH value to send
      callData: '0x...' // Encoded function call
    }
  ]]
});

// Send the transaction from the delegate account
const tx = {
  to: DELEGATION_MANAGER_ADDRESS,
  data: redeemCalldata,
  from: '${delegateAddress}'
};
\`\`\``;
}

/**
 * Generates the re-delegation section
 *
 * @returns Formatted re-delegation markdown
 */
function generateRedelegationSection(): string {
  return `## Re-delegation (Sub-Permissions)

This delegation supports **re-delegation**. The delegate (agent) can create new delegations
that grant a subset of their permissions to other accounts, creating a delegation chain.

### How to Re-delegate

1. Create a new delegation where:
   - \`delegator\` = this delegation's delegate address
   - \`authority\` = the hash of this delegation
   - \`caveats\` = same or MORE restrictive caveats

2. Sign the new delegation with the delegate private key

3. The new delegate can use both delegations together in a chain

### Important Rules

- Re-delegated permissions can only be **equal to or more restrictive** than the parent
- The caveat enforcers will validate the entire chain
- Multiple levels of re-delegation are supported

### Example Chain

\`\`\`
Root Account (Alice)
    ↓ delegates with 100 USDC limit
Agent Account (Bob)
    ↓ re-delegates with 50 USDC limit (more restrictive)
Sub-Agent Account (Charlie)
\`\`\`

Charlie can spend up to 50 USDC using a chain of [Charlie's delegation, Bob's delegation].`;
}

/**
 * Generates the framework documentation section
 *
 * @returns Formatted framework docs markdown
 */
function generateFrameworkDocsSection(): string {
  return `## Framework Documentation

### MetaMask Delegation Framework

The MetaMask Delegation Framework enables secure, granular permission delegation on Ethereum.
It uses smart contract "caveat enforcers" to validate each action against the delegation's restrictions.

### Key Concepts

- **Delegation**: A signed message granting permissions from a delegator to a delegate
- **Caveat**: A restriction enforced by a smart contract before any action executes
- **Authority**: Links delegations in a chain (root delegations use a special constant)
- **Redemption**: The process of using a delegation to execute an action

### Links

- **GitHub Repository**: ${FRAMEWORK_LINKS.github}
- **ERC-7715 Specification**: ${FRAMEWORK_LINKS.erc7715}
- **Caveat Enforcers**: ${FRAMEWORK_LINKS.enforcers}
- **MetaMask Flask**: ${FRAMEWORK_LINKS.metamask}

### Security Model

1. **Caveats Can Only Restrict**: A delegation cannot grant more authority than the delegator has
2. **Chain Validation**: The entire delegation chain is validated for each action
3. **On-Chain Enforcement**: Caveat enforcers are smart contracts that cannot be bypassed
4. **Revocable**: Delegations can be disabled on-chain by the delegator`;
}

/**
 * Generates the gator-cli documentation section
 *
 * @returns Formatted gator-cli docs markdown
 */
function generateGatorCliSection(): string {
  return `## Using Gator-CLI

### What is Gator-CLI?

Gator-CLI is MetaMask's command-line tool for managing EIP-7702 smart accounts and delegation permissions.
It provides an easy way to test, debug, and interact with delegations from the command line.

**GitHub**: ${FRAMEWORK_LINKS.gatorCli}

### Installation

\`\`\`bash
npm install -g @metamask/gator-cli
# or
yarn global add @metamask/gator-cli
\`\`\`

### Quick Start for Agents

1. **Initialize with the delegate private key from this package:**

\`\`\`bash
# Import the delegate private key (from the "Delegate Account Information" section above)
gator init --privateKey <DELEGATE_PRIVATE_KEY>
gator init --chain baseSepolia  # or your target chain
\`\`\`

2. **Check your delegation status:**

\`\`\`bash
gator status
gator inspect
\`\`\`

3. **Redeem the delegation to execute actions:**

\`\`\`bash
# Example: Transfer tokens using this delegation
gator redeem --from <DELEGATOR_ADDRESS> --scope erc20TransferAmount \\
  --tokenAddress <TOKEN_ADDRESS> --to <RECIPIENT> --amount <AMOUNT>
\`\`\`

### Key Commands

| Command | Description |
|---------|-------------|
| \`gator init\` | Initialize with a private key |
| \`gator status\` | Check account and delegation status |
| \`gator balance\` | View native or token balances |
| \`gator redeem\` | Execute an action using a delegation |
| \`gator inspect\` | View all delegations for your account |

### Supported Scopes

- \`erc20TransferAmount\` - Transfer ERC20 tokens
- \`nativeTransferAmount\` - Transfer native tokens (ETH)
- \`erc721Transfer\` - Transfer NFTs
- \`functionCall\` - Call specific contract functions

### Example: Using This Delegation

\`\`\`bash
# 1. Set up gator with the delegate key
gator init --privateKey <YOUR_DELEGATE_PRIVATE_KEY>

# 2. View the delegation you received
gator inspect

# 3. Check available balance
gator balance --tokenAddress <TOKEN_ADDRESS>

# 4. Execute an action within your permitted scope
gator redeem --from <DELEGATOR_ADDRESS> \\
  --delegation <DELEGATION_DATA> \\
  --target <CONTRACT_ADDRESS> \\
  --calldata <ENCODED_FUNCTION_CALL>
\`\`\`

### Tips for Agent Developers

- Always check \`gator status\` before attempting to redeem
- Use \`--dry-run\` flag to simulate transactions without executing
- The delegation data can be passed directly to redeem commands
- Multiple delegations can be chained for re-delegation scenarios`;
}

/**
 * Generates the communication channel section (Phase 2)
 *
 * @param channelId - The communication channel ID
 * @returns Formatted communication channel markdown
 */
function generateCommunicationChannelSection(channelId?: string): string {
  if (!channelId) {
    return '';
  }

  return `## Communication Channel (Permission Requests)

This delegation includes a communication channel for requesting additional permissions.

**Channel ID**: \`${channelId}\`

### Requesting Additional Permissions

When the agent needs more permissions than currently granted, it can request them through this channel.

#### Request Format

\`\`\`json
{
  "channelId": "${channelId}",
  "requestId": "unique-request-id",
  "naturalLanguageRequest": "I need permission to swap tokens on Curve Finance"
}
\`\`\`

### How It Works

1. Agent sends a permission request describing what additional access is needed
2. The delegator (user) receives a notification in MetaMask
3. User reviews, optionally modifies, and approves or denies the request
4. If approved, a new delegation is created and returned to the agent
5. Agent can use the new delegation (potentially chained with this one)

### Best Practices for Agents

- Be specific about what permissions you need and why
- Request the minimum permissions necessary
- Include context about the task requiring the permission
- Handle denial gracefully with fallback behavior
`;
}

/**
 * Generates the complete agent output document
 *
 * @param options - The options for generating the output
 * @returns The complete output document with markdown and raw data
 */
export function generateAgentOutput(
  options: AgentOutputOptions,
): AgentOutputDocument {
  const {
    delegation,
    delegateAddress,
    delegatePrivateKey,
    originalPrompt,
    chainId,
    communicationChannelId,
  } = options;

  // Encode the delegation
  const delegationData = encodeDelegation([delegation]);

  // Generate the markdown document
  const markdown = `# Agent Delegation Package

> Generated by MetaMask Flask - Agent Account Feature

## Overview

This document contains a signed delegation granting limited permissions to an agent account.
The delegation allows the agent to perform specific actions on behalf of the delegator,
subject to the restrictions (caveats) defined below.

### Quick Reference

| Field | Value |
|-------|-------|
| **Chain ID** | ${chainId} |
| **Delegator** | \`${formatAddress(delegation.delegator)}\` |
| **Delegate (Agent)** | \`${formatAddress(delegateAddress)}\` |
| **Authority** | ${delegation.authority === '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' ? 'Root (direct delegation)' : `Chained: \`${formatAddress(delegation.authority as Hex, true)}\``} |
| **Caveats** | ${options.caveats.length} |

### Original Request

> "${originalPrompt}"

---

${generatePermissionsSection(options)}

---

${generateUsageSection(options)}

---

${generateRedelegationSection()}

---

${generateFrameworkDocsSection()}

---

${generateGatorCliSection()}

${generateCommunicationChannelSection(communicationChannelId)}

---

## Serialized Delegation Data

The following hex-encoded data contains the complete signed delegation.
This can be decoded and used programmatically.

\`\`\`
${delegationData}
\`\`\`

### Raw Delegation Object

\`\`\`json
${JSON.stringify(
  {
    delegate: delegation.delegate,
    delegator: delegation.delegator,
    authority: delegation.authority,
    caveats: delegation.caveats.map((c) => ({
      enforcer: c.enforcer,
      terms: c.terms,
      args: c.args,
    })),
    salt: delegation.salt,
    signature: delegation.signature,
  },
  null,
  2,
)}
\`\`\`

---

## Security Reminders

1. **Store the private key securely** - It grants access to use this delegation
2. **Monitor delegation usage** - Check on-chain for how the delegation is being used
3. **Revoke if compromised** - Call \`disableDelegation\` on the DelegationManager if needed
4. **Verify agent behavior** - Caveats enforce on-chain, but verify expected behavior off-chain too

---

*This delegation was created using MetaMask Flask's Agent Account feature.*
*For support, visit: https://support.metamask.io/*
`;

  return {
    markdown,
    delegationData,
    delegatePrivateKey,
  };
}

/**
 * Formats the output for download as a text file
 *
 * @param output - The output document
 * @returns Formatted string for download
 */
export function formatOutputForDownload(output: AgentOutputDocument): string {
  return output.markdown;
}

/**
 * Extracts just the delegation data for clipboard copy
 *
 * @param output - The output document
 * @returns Just the serialized delegation data
 */
export function extractDelegationDataForCopy(output: AgentOutputDocument): Hex {
  return output.delegationData;
}
