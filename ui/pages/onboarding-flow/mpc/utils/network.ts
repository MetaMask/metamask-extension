// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - module types not available
import { PairwiseEncryption } from '@metamask/mfa-wallet-e2ee';
import type {
  ChannelMessage,
  EncryptionOptions,
  EncryptionProvider,
  NetworkSession,
  PartyMessage,
  Transport,
} from '@metamask/mfa-wallet-interface';
import {
  MfaSession,
  MemoryKvStore,
  WebSocketTransport,
  createChannelAdapter,
} from '@metamask/mfa-wallet-network';
import { generateCentrifugoToken } from './crypto';

/**
 * Create encryption provider factory for pairwise encryption
 */
const encryptionFactory = (
  selfId: string,
  parties: string[],
): EncryptionProvider => new PairwiseEncryption(selfId, parties, 'XX');

/**
 * Create and connect a WebSocket transport to Centrifugo
 */
export async function createTransport(
  partyId: string,
  centrifugeUrl: string,
): Promise<Transport<ChannelMessage<PartyMessage>>> {
  const token = await generateCentrifugoToken(partyId);

  const transport = await WebSocketTransport.create<PartyMessage>({
    url: centrifugeUrl,
    token,
    websocket: WebSocket,
    kvStore: new MemoryKvStore(),
  });

  await transport.connect();
  return transport;
}

/**
 * Create a network session with optional encryption
 */
export async function createSession(
  sessionId: string,
  partyId: string,
  parties: string[],
  transport: Transport<ChannelMessage<PartyMessage>>,
  skipEncryptionInit = false,
): Promise<NetworkSession> {
  const adapter = createChannelAdapter<PartyMessage>(sessionId, transport);

  const encryption: EncryptionOptions | undefined =
    parties.length > 1 ? { factory: encryptionFactory, parties } : undefined;

  const session = new MfaSession(sessionId, partyId, adapter, encryption);

  await (transport as WebSocketTransport<PartyMessage>).subscribe(sessionId);

  if (encryption && !skipEncryptionInit) {
    await session.initializeEncryption();
  }

  return session;
}

