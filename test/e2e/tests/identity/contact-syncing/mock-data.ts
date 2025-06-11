import { IDENTITY_TEAM_STORAGE_KEY } from '../constants';
import type { UserStorageContact } from './helpers';

// Mock contact addresses for testing
export const MOCK_CONTACT_ADDRESSES = {
  ALICE: '0x1234567890123456789012345678901234567890',
  BOB: '0x2345678901234567890123456789012345678901',
  CHARLIE: '0x3456789012345678901234567890123456789012',
  DIANA: '0x4567890123456789012345678901234567890123',
};

// Mock chain IDs
export const MOCK_CHAIN_IDS = {
  MAINNET: '0x1',
  SEPOLIA: '0xaa36a7',
  POLYGON: '0x89',
};

/**
 * Creates a mock contact for testing
 * @param overrides - Properties to override in the mock contact
 * @returns Mock contact object
 */
export function createMockContact(overrides: Partial<UserStorageContact> = {}): UserStorageContact {
  const now = Math.floor(Date.now() / 1000); // Use seconds like account syncing

  return {
    v: '1',
    a: MOCK_CONTACT_ADDRESSES.ALICE,
    c: MOCK_CHAIN_IDS.MAINNET,
    n: 'Alice Smith',
    m: 'Trading partner',
    lu: now,
    ...overrides,
  };
}

/**
 * Mock contact data for various test scenarios
 */
export const MOCK_CONTACTS = {
  // Basic contacts for initial sync
  ALICE_MAINNET: createMockContact({
    a: MOCK_CONTACT_ADDRESSES.ALICE,
    c: MOCK_CHAIN_IDS.MAINNET,
    n: 'Alice Smith',
    m: 'DeFi trading partner',
  }),

  BOB_SEPOLIA: createMockContact({
    a: MOCK_CONTACT_ADDRESSES.BOB,
    c: MOCK_CHAIN_IDS.SEPOLIA,
    n: 'Bob Johnson',
    m: 'Test network contact',
  }),

  CHARLIE_POLYGON: createMockContact({
    a: MOCK_CONTACT_ADDRESSES.CHARLIE,
    c: MOCK_CHAIN_IDS.POLYGON,
    n: 'Charlie Brown',
    m: 'Polygon validator',
  }),

  // Same address on different chains (should be separate contacts)
  ALICE_SEPOLIA: createMockContact({
    a: MOCK_CONTACT_ADDRESSES.ALICE,
    c: MOCK_CHAIN_IDS.SEPOLIA,
    n: 'Alice Testnet',
    m: 'Same person, different network',
  }),

  // Contact for conflict resolution testing
  DIANA_OLD: createMockContact({
    a: MOCK_CONTACT_ADDRESSES.DIANA,
    c: MOCK_CHAIN_IDS.MAINNET,
    n: 'Diana Old Name',
    m: 'Old memo',
    lu: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  }),

  DIANA_NEW: createMockContact({
    a: MOCK_CONTACT_ADDRESSES.DIANA,
    c: MOCK_CHAIN_IDS.MAINNET,
    n: 'Diana New Name',
    m: 'Updated memo',
    lu: Math.floor(Date.now() / 1000), // Now
  }),

  // Contact without memo (minimal data)
  MINIMAL_CONTACT: createMockContact({
    a: MOCK_CONTACT_ADDRESSES.BOB,
    c: MOCK_CHAIN_IDS.MAINNET,
    n: 'Minimal Bob',
    m: undefined,
  }),
};

/**
 * Pre-configured mock storage entries for different test scenarios
 */
export const MOCK_STORAGE_DATA = {
  EMPTY_STORAGE: [],

  SINGLE_CONTACT: [
    {
      storageKey: IDENTITY_TEAM_STORAGE_KEY,
      data: [MOCK_CONTACTS.ALICE_MAINNET],
    },
  ],

  MULTIPLE_CONTACTS: [
    {
      storageKey: IDENTITY_TEAM_STORAGE_KEY,
      data: [
        MOCK_CONTACTS.ALICE_MAINNET,
        MOCK_CONTACTS.BOB_SEPOLIA,
        MOCK_CONTACTS.CHARLIE_POLYGON,
      ],
    },
  ],

  CROSS_CHAIN_CONTACTS: [
    {
      storageKey: IDENTITY_TEAM_STORAGE_KEY,
      data: [
        MOCK_CONTACTS.ALICE_MAINNET,
        MOCK_CONTACTS.ALICE_SEPOLIA, // Same address, different chain
      ],
    },
  ],

  CONFLICT_SCENARIO: [
    {
      storageKey: IDENTITY_TEAM_STORAGE_KEY,
      data: [MOCK_CONTACTS.DIANA_OLD], // Will conflict with newer local version
    },
  ],
};

/**
 * Creates contact keys in the format expected by the syncing system
 * @param contact - The contact to create a key for
 * @returns Contact key string
 */
export function createContactKey(contact: UserStorageContact): string {
  return `${contact.c}_${contact.a.toLowerCase()}`;
}

/**
 * Converts a UserStorageContact to the format expected by AddressBookController
 * @param contact - The contact to convert
 * @returns AddressBook entry format
 */
export function mockContactToAddressBookEntry(contact: UserStorageContact) {
  return {
    address: contact.a,
    chainId: contact.c,
    name: contact.n,
    memo: contact.m || '',
    lastUpdatedAt: contact.lu * 1000, // Convert back to milliseconds
  };
}