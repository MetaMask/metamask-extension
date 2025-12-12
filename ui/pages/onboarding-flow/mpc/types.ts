import type { ThresholdKey } from '@metamask/mfa-wallet-interface';

export type SigningProtocol = 'dkls' | 'frost';
export type KeyType = 'secp256k1' | 'edwards25519';

export type PartyId = '1' | '2' | '3';

export type PartyWithKey = {
  id: PartyId;
  key: ThresholdKey;
  keyType: KeyType;
};

// Stored key share format for localStorage
export type StoredKeyShare = {
  publicKey: number[];
  shareIndex: number;
  custodians: string[];
  threshold: number;
  shareIndexes: number[];
  keyType: KeyType;
  partyId: PartyId;
  createdAt: string;
  hasThreeParties: boolean;
  // Store entire key as JSON for full restoration
  keyJson: string;
  // tssVerifierId is needed to find the share on the server
  tssVerifierId: string;
};

export type SigningParties = {
  party1: boolean; // Server
  party2: boolean; // Client
  party3: boolean; // New party (mobile)
};

export type MpcConfig = {
  centrifugeUrl: string;
  serverUrl: string;
  tssVerifierId: string;
};

export type MpcState = {
  keysGenerated: boolean;
  hasThreeParties: boolean;
  isLoading: boolean;
  status: string;
  statusType: 'info' | 'success' | 'error' | 'warning';
};

// Minimal QR payloads - mobile hardcodes centrifugeUrl and other configs
export type UpdateKeyQRPayload = {
  t: 'u'; // type: update-key
  s: string; // sessionId
  k: KeyType; // keyType
  p: number[]; // publicKey
  i: number[]; // shareIndexes
};

export type SignQRPayload = {
  t: 's'; // type: sign
  s: string; // sessionId
  p: SigningProtocol; // protocol
  m: number[]; // message hash (first 8 bytes for display)
};
