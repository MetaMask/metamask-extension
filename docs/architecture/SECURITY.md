# Security Model

## Overview
MetaMask's security model is built on the principle of isolated contexts, secure communication channels, and robust cryptographic practices.

## Key Files and Directories
- `shared/modules/security-provider.utils.ts` - Security provider implementations
- `app/scripts/lib/security/` - Core security implementations
- `shared/constants/security.ts` - Security constants
- `app/scripts/lib/encryption/` - Encryption utilities
- `.metamaskrc` - Security configuration

## Core Security Principles

### 1. Isolation (`app/scripts/lib/security/isolation.ts`)
- Separate extension contexts
- Sandboxed execution environments
- Isolated storage spaces

### 2. Access Control

#### Permission System (`app/scripts/controllers/permissions/`)
- `permissions.ts` - Permission controller
- `specifications.ts` - Permission specifications
- `selectors.ts` - Permission state selectors

#### Content Security Policy (`app/manifest/`)
- CSP configuration in manifest
- Resource access restrictions
- Script execution controls

### 3. Cryptographic Security

#### Key Management (`app/scripts/lib/encryption/`)
- `vault.ts` - Secure key storage
- `encryption.ts` - Encryption utilities
- `key-generation.ts` - Key generation logic

#### Transaction Signing (`app/scripts/controllers/transactions/`)
- Secure signing environment
- User confirmation requirements
- Hardware wallet support

## Security Boundaries

### Extension Context Isolation
```
Web Page <-> Content Script <-> Background Process
     ↑          ↑                ↑
     └──────────┴────────────────┘
      Validated Message Passing
```

### Storage Security (`app/scripts/lib/storage/`)
- `encrypted-storage.ts` - Encrypted storage implementation
- `secure-storage.ts` - Secure storage utilities
- `preference-storage.ts` - Protected preference storage

## Implementation Details

### 1. Authentication (`app/scripts/lib/auth/`)
- Password-based encryption
- Biometric authentication support
- Session management

### 2. Network Security (`shared/modules/network.utils.ts`)
- Secure RPC connections
- Request validation
- Rate limiting

### 3. Data Protection
Located in `app/scripts/lib/data-protection/`:
- State encryption
- Secure memory handling
- Data sanitization

## Development Guidelines

### Security Implementation
1. Input Validation
   - Use validation utilities in `shared/modules/validation/`
   - Implement type checking
   - Sanitize user input

2. Cryptographic Operations
   - Use approved crypto libraries
   - Follow key management best practices
   - Implement secure random number generation

3. Error Handling
   - Implement secure error handling
   - Avoid information leakage
   - Log security events appropriately

## Testing Requirements

### Security Tests
Located in `test/security/`:
- `isolation.test.js` - Context isolation tests
- `crypto.test.js` - Cryptographic tests
- `permissions.test.js` - Permission tests
- `csp.test.js` - CSP validation tests

### Penetration Testing
- Regular security audits
- Vulnerability scanning
- Access control testing

## Related Documentation
- See `docs/PROVIDER_INJECTION.md` for provider security
- See `docs/STATE_MANAGEMENT.md` for secure state handling
- Security configuration guide in `app/scripts/lib/security/README.md`