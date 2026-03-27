# @dial/sdk

> Web3-native communication primitives for wallet-to-wallet calling, messaging, video conferencing, and live streaming.

[![npm version](https://badge.fury.io/js/@dial%2Fsdk.svg)](https://www.npmjs.com/package/@dial/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

The Dial SDK provides Web3-native communication primitives, enabling developers to integrate wallet-to-wallet calling, messaging, video conferencing, and live streaming directly into their applications.

Built for the decentralized web, the Dial SDK allows users to communicate using their wallet addresses as their identity—no phone numbers or centralized accounts required.

## ✨ Features

| Feature | Description | Environment |
|---------|-------------|-------------|
| 🔊 **Wallet-to-Wallet Calls** | Audio and video calling using wallet addresses | Isomorphic* |
| 📧 **Voicemail** | Persistent voicemail storage with transcription | Isomorphic |
| 💬 **Messaging** | Direct wallet-to-wallet messaging | Isomorphic |
| 🎥 **Video Conferencing** | Multi-party video collaboration spaces | Isomorphic* |
| 🚪 **Gated Rooms** | Token-gated access to video rooms | Isomorphic |
| 📡 **Party Lines** | Public voice/video rooms | Isomorphic |
| 👤 **Profiles** | Wallet-based user profiles | Isomorphic |

*\*Media streaming features require browser environment*

## 🚀 Quick Start

### Installation (Private Alpha)

There are two ways to install the SDK during Private Alpha:

#### Option A: Clone and Export (recommended)

Clone the SDK repository into your organization's development environment and use the built-in build and export scripts to vendor the distribution into your TypeScript project.

```bash
# 1. Clone the SDK
git clone https://github.com/Dial-WTF/Dial-SDK.git
cd Dial-SDK

# 2. Build the distribution
./build

# 3. Export to your project
./export ../my-app/src/vendor
```

This creates a `dial-sdk/` directory at the target location with the compiled distribution.

#### Option B: Download a Release Archive

Download the latest `dial-sdk-v*.tar.gz` from [GitHub Releases](https://github.com/Dial-WTF/Dial-SDK/releases) and extract it into your project:

```bash
# Download the release archive (example)
tar -xzf dial-sdk-v0.3.0.tar.gz -C src/vendor/
```

#### Add the SDK Dependency

After exporting or extracting, add the SDK as a `file:` dependency in your project's `package.json`:

```jsonc
// your-project/package.json
{
  "dependencies": {
    "@dial-wtf/sdk": "file:./src/vendor/dial-sdk"
  }
}
```

```bash
pnpm install   # or npm install / yarn
```

#### Recommended vendor locations

| Project Type | Export target | Dependency path |
|---|---|---|
| **Next.js / React** | `./export ../my-app/src/vendor` | `"file:./src/vendor/dial-sdk"` |
| **Node.js service** | `./export ../my-service/vendor` | `"file:./vendor/dial-sdk"` |
| **Monorepo package** | `./export ../packages/dial-sdk` | `"file:./packages/dial-sdk"` (no nesting) |

#### TypeScript path aliases (skip the `../../` mess)

When you install a `file:` dependency, your package manager symlinks it into `node_modules/@dial-wtf/sdk`. This means standard imports already resolve automatically — no path config needed:

```typescript
import { DialClient } from '@dial-wtf/sdk';
import type { Call, Message } from '@dial-wtf/sdk/types';
```

**Next.js projects** use `@/` as an alias for `src/` by default. The `file:` dependency approach means `@dial-wtf/sdk` resolves through `node_modules` just like any other package — no `../../vendor/dial-sdk` imports needed.

If you prefer explicit TypeScript path resolution (e.g., for IDE go-to-definition), you can optionally add this to your `tsconfig.json`:

```jsonc
// tsconfig.json (optional — only if you need explicit path mapping)
{
  "compilerOptions": {
    "paths": {
      "@dial-wtf/sdk": ["./src/vendor/dial-sdk/dist/index.d.ts"],
      "@dial-wtf/sdk/*": ["./src/vendor/dial-sdk/dist/*"]
    }
  }
}
```

#### pnpm scripts

You can also use the pnpm script variants:

```bash
pnpm run build                      # Build the distribution
pnpm run export:to ../my-app        # Export to a target project
pnpm run release                    # Tag, build, and publish a new release
```

> **Need help?** Reach out if you would like to hop on a call with a member of our team to walk you through this process.

### Basic Usage

```typescript
import { DialClient } from '@dial-wtf/sdk';
import { SiweMessage } from 'siwe';

// Initialize universal client
const dial = new DialClient({
  apiKey: process.env.DIAL_API_KEY,
  network: 'mainnet' // or 'staging', 'testnet'
});

// Get nonce for SIWE authentication
const nonce = await dial.auth.getNonce();

// Create and sign SIWE message
const siweMessage = new SiweMessage({
  domain: 'dial.wtf',
  address: walletAddress,
  statement: 'Sign in to Dial',
  uri: 'https://dial.wtf',
  version: '1',
  chainId: 1,
  nonce,
});

const message = siweMessage.prepareMessage();
const signature = await wallet.signMessage(message);

// Authenticate
const userDialer = await dial.asUser({
  siwe: { message, signature }
});

// Make a call
const call = await userDialer.calls.start({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  type: 'video'
});
```

## 📚 API Reference

### DialClient (Universal Client)

The main entry point. No authentication required for public features.

```typescript
const dial = new DialClient({
  apiKey: 'your-api-key',
  network: 'mainnet',
  timeout: 30000,
  debug: false,
});

// Public features (no auth)
const partyLines = await dial.partyLines.getActive();
const profiles = await dial.registry.searchProfiles({ query: 'alice' });

// Authentication
const userDialer = await dial.asUser({ siwe: { message, signature } });
```

### UserDialer (Authenticated Client)

Created via `dial.asUser()`. Provides access to user-specific features.

```typescript
// Calls
await userDialer.calls.start({ to: '0x...', type: 'audio' });
await userDialer.calls.answer(callId);
await userDialer.calls.end(callId);

// Messages
await userDialer.messages.send({ to: '0x...', content: 'Hello!' });
const conversations = await userDialer.messages.getConversations();

// Profile
const profile = await userDialer.profile.get();
await userDialer.profile.update({ displayName: 'Alice.eth' });

// Voicemail
const voicemails = await userDialer.voicemail.getAll();
await userDialer.voicemail.markAsRead(voicemailId);

// Conference
const room = await userDialer.conference.create({ name: 'Team Standup' });
await userDialer.conference.join({ roomId: room.id });

// Events
userDialer.on('call:incoming', (call) => {
  console.log('Incoming call from:', call.from);
});
```

## 🌍 Isomorphic Design

The SDK is designed to work in both browser and Node.js environments:

### Fully Isomorphic Features
- Authentication (SIWE/SIWS)
- Profile management
- Messaging (send, receive, history)
- Call management (start, end, mute)
- Voicemail management
- Conference room management
- Party Lines queries

### Browser-Only Features
- Media streams (`getLocalStream`, `getRemoteStream`)
- Screen sharing
- File uploads (avatar, media)
- Push notifications

```typescript
import { IS_BROWSER, BROWSER_ONLY_FEATURES } from '@dial-wtf/sdk';

if (IS_BROWSER) {
  const stream = userDialer.calls.getLocalStream(callId);
}
```

## 🔐 Authentication

### SIWE (Ethereum)

```typescript
import { SiweMessage } from 'siwe';

const nonce = await dial.auth.getNonce();
const siweMessage = new SiweMessage({
  domain: 'dial.wtf',
  address: walletAddress,
  statement: 'Sign in to Dial',
  uri: 'https://dial.wtf',
  version: '1',
  chainId: 1,
  nonce,
});

const message = siweMessage.prepareMessage();
const signature = await signer.signMessage(message);

const userDialer = await dial.asUser({
  siwe: { message, signature }
});
```

### SIWS (Solana)

```typescript
const nonce = await dial.auth.getNonce();
// Create SIWS message...
const userDialer = await dial.asUser({
  siws: { message, signature }
});
```

### Session Management

```typescript
// Export session for persistence
const sessionData = userDialer.exportSession();
localStorage.setItem('dial_session', JSON.stringify(sessionData));

// Restore session
const dial = new DialClient({ apiKey: '...' });
const userDialer = await dial.restoreSession(
  JSON.parse(localStorage.getItem('dial_session'))
);

// Validate session
if (await userDialer.isSessionValid()) {
  // Session is active
}
```

## 📦 Package Structure

```
@dial/sdk
├── src/
│   ├── index.ts          # Main exports
│   ├── client/           # DialClient, UserDialer
│   ├── services/         # Feature services
│   ├── http/             # HTTP client
│   ├── types/            # TypeScript types
│   ├── utils/            # Environment utilities
│   └── errors.ts         # Error classes
├── dist/                 # Compiled output
└── package.json
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm typecheck

# Run tests
pnpm test
```

## 🎮 Examples

### PeepoToken Dashboard

A fun example app demonstrating SDK integration with a fake memecoin dashboard:

```bash
cd examples/peepo-dashboard
pnpm install
pnpm dev
```

Features:
- 🐸 Fake token trading with localStorage persistence
- 📈 Price chart that mostly goes up (WAGMI)
- 🔗 Real Privy wallet connection
- 📞 **Dial SDK integration** - In-app community intercom with party lines, directory, and calling

[View Example Source](./examples/peepo-dashboard)

## 📖 Documentation

- [Full Documentation](https://docs.dial.wtf/sdk)
- [API Reference](https://docs.dial.wtf/sdk/api-reference)
- [Examples](https://docs.dial.wtf/sdk/examples)

## 🔗 Related

- [Dial.wtf](https://dial.wtf) - Main application
- [Documentation](https://docs.dial.wtf) - Full docs
- [GitHub](https://github.com/Dial-WTF/SDK) - Source code

## 📄 License

MIT © [Dial.wtf](https://dial.wtf)

