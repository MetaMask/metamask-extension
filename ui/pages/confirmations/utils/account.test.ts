import { InternalAccount } from '@metamask/keyring-internal-api';
import { isEVMAccountForSend, isSolanaAccountForSend } from './account';

describe('Account Send Utils', () => {
  describe('isEVMAccountForSend', () => {
    it('returns false when account is null', () => {
      expect(isEVMAccountForSend(null as any)).toBe(false);
    });

    it('returns false when account is undefined', () => {
      expect(isEVMAccountForSend(undefined as any)).toBe(false);
    });

    it('returns true when account type starts with eip155:', () => {
      const account = {
        id: 'test-id',
        type: 'eip155:ethereum',
        address: '0x123',
        metadata: {},
        methods: [],
        options: {},
      } as unknown as InternalAccount;
      expect(isEVMAccountForSend(account)).toBe(true);
    });

    it('returns true when account has eip155 scope', () => {
      const account = {
        id: 'test-id',
        type: 'other:type',
        address: '0x123',
        metadata: {},
        methods: [],
        options: {},
        scopes: ['eip155:1', 'other:scope'],
      } as unknown as InternalAccount;
      expect(isEVMAccountForSend(account)).toBe(true);
    });

    it('returns false when account type does not start with eip155 and has no eip155 scopes', () => {
      const account = {
        id: 'test-id',
        type: 'solana:mainnet',
        address: 'solana-address',
        metadata: {},
        methods: [],
        options: {},
        scopes: ['solana:mainnet'],
      } as unknown as InternalAccount;
      expect(isEVMAccountForSend(account)).toBe(false);
    });

    it('returns false when account has no type or scopes', () => {
      const account = {
        id: 'test-id',
        type: '',
        address: '0x123',
        metadata: {},
        methods: [],
        options: {},
      } as unknown as InternalAccount;
      expect(isEVMAccountForSend(account)).toBe(false);
    });

    it('returns false when account has scopes but none start with eip155', () => {
      const account = {
        id: 'test-id',
        type: 'other:type',
        address: '0x123',
        metadata: {},
        methods: [],
        options: {},
        scopes: ['solana:mainnet', 'bitcoin:mainnet'],
      } as unknown as InternalAccount;
      expect(isEVMAccountForSend(account)).toBe(false);
    });
  });

  describe('isSolanaAccountForSend', () => {
    it('returns false when account is null', () => {
      expect(isSolanaAccountForSend(null as any)).toBe(false);
    });

    it('returns false when account is undefined', () => {
      expect(isSolanaAccountForSend(undefined as any)).toBe(false);
    });

    it('returns true when account type starts with solana:', () => {
      const account = {
        id: 'test-id',
        type: 'solana:mainnet',
        address: 'solana-address',
        metadata: {},
        methods: [],
        options: {},
      } as unknown as InternalAccount;
      expect(isSolanaAccountForSend(account)).toBe(true);
    });

    it('returns true when account has solana scope', () => {
      const account = {
        id: 'test-id',
        type: 'other:type',
        address: 'test-address',
        metadata: {},
        methods: [],
        options: {},
        scopes: ['solana:mainnet', 'other:scope'],
      } as unknown as InternalAccount;
      expect(isSolanaAccountForSend(account)).toBe(true);
    });

    it('returns false when account type does not start with solana and has no solana scopes', () => {
      const account = {
        id: 'test-id',
        type: 'eip155:ethereum',
        address: '0x123',
        metadata: {},
        methods: [],
        options: {},
        scopes: ['eip155:1'],
      } as unknown as InternalAccount;
      expect(isSolanaAccountForSend(account)).toBe(false);
    });

    it('returns false when account has no type or scopes', () => {
      const account = {
        id: 'test-id',
        type: '',
        address: 'test-address',
        metadata: {},
        methods: [],
        options: {},
      } as unknown as InternalAccount;
      expect(isSolanaAccountForSend(account)).toBe(false);
    });

    it('returns false when account has scopes but none start with solana', () => {
      const account = {
        id: 'test-id',
        type: 'other:type',
        address: 'test-address',
        metadata: {},
        methods: [],
        options: {},
        scopes: ['eip155:1', 'bitcoin:mainnet'],
      } as unknown as InternalAccount;
      expect(isSolanaAccountForSend(account)).toBe(false);
    });
  });
});
