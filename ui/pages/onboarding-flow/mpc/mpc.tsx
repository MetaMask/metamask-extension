/* eslint-disable @metamask/design-tokens/color-no-hex */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  CL24DKM,
  secp256k1 as secp256k1Curve,
  edwards25519 as ed25519Curve,
} from '@metamask/mfa-wallet-cl24-lib';
import { DklsTssLib } from '@metamask/mfa-wallet-dkls19-lib';
import { FrostTssLib } from '@metamask/mfa-wallet-frost-lib';
import type {
  RandomNumberGenerator,
  TSSLibrary,
} from '@metamask/mfa-wallet-interface';
import { initShareIndexes } from '@metamask/mfa-wallet-util';
import { load as loadDkls } from '@metamask/tss-dkls19-lib';
import { load as loadFrost } from '@metamask/tss-frost-lib';

import type {
  KeyType as MpcKeyType,
  SigningProtocol,
  SigningParties,
  PartyWithKey,
  StoredKeyShare,
  UpdateKeyQRPayload,
  SignQRPayload,
} from './types';
import {
  DEFAULT_CENTRIFUGE_URL,
  DEFAULT_SERVER_URL,
  SERVER_PARTY_ID,
  CLIENT_PARTY_ID,
  NEW_PARTY_ID,
} from './constants';
import {
  BrowserRandomNumberGenerator,
  createSessionId,
  createTransport,
  createSession,
  verifyEcdsaSignature,
  verifySchnorrSignature,
  saveKeyShare,
  loadKeyShare,
  deleteKeyShare,
  deserializeKey,
} from './utils';
import {
  StatusDisplay,
  PartySelector,
  LogViewer,
  ConfigInputs,
  KeyTypeSelector,
  SigningProtocolSelector,
  QRCodeDisplay,
  KeyShareCard,
} from './components';

type KeyType = MpcKeyType;

function initCL24DKG(keyType: KeyType, rng: RandomNumberGenerator): CL24DKM {
  const curve = keyType === 'secp256k1' ? secp256k1Curve : ed25519Curve;
  return new CL24DKM(keyType, curve, {
    generateRandomBytes: (size: number) => rng.generateRandomBytes(size),
  });
}

async function initTSSLibrary(
  protocol: SigningProtocol,
  rng: RandomNumberGenerator,
): Promise<TSSLibrary> {
  if (protocol === 'dkls') {
    const wasmLib = await loadDkls();
    return new DklsTssLib(wasmLib, rng);
  }
  const wasmLib = await loadFrost();
  return new FrostTssLib(wasmLib, rng);
}

const MpcPage: React.FC = () => {
  // Config
  const [centrifugeUrl, setCentrifugeUrl] = useState(DEFAULT_CENTRIFUGE_URL);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [tssVerifierId, setTssVerifierId] = useState(
    `user-${Math.random().toString(36).substring(2, 10)}`,
  );

  // Protocol
  const [keyType, setKeyType] = useState<KeyType>('edwards25519');
  const [signingProtocol, setSigningProtocol] =
    useState<SigningProtocol>('frost');
  const [signingParties, setSigningParties] = useState<SigningParties>({
    party1: true,
    party2: true,
    party3: false,
  });

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [statusType, setStatusType] = useState<
    'info' | 'success' | 'error' | 'warning'
  >('info');
  const [logs, setLogs] = useState<string[]>([]);
  const [keysGenerated, setKeysGenerated] = useState(false);
  const [hasThreeParties, setHasThreeParties] = useState(false);
  const [storedKeyShare, setStoredKeyShare] = useState<StoredKeyShare | null>(
    null,
  );

  // QR
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrTitle, setQrTitle] = useState('');
  const [qrSubtitle, setQrSubtitle] = useState('');
  const [qrStatus, setQrStatus] = useState<
    'waiting' | 'connecting' | 'connected' | 'error'
  >('waiting');
  const [qrStatusMessage, setQrStatusMessage] = useState('');
  const cancelledRef = useRef(false);
  const startConnectionRef = useRef<{
    resolve: () => void;
    reject: (e: Error) => void;
  } | null>(null);

  // Keys
  const partyKeysRef = useRef<PartyWithKey | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  useEffect(() => {
    setSigningProtocol(keyType === 'secp256k1' ? 'dkls' : 'frost');
  }, [keyType]);

  // Load key share from localStorage on mount
  useEffect(() => {
    const stored = loadKeyShare();
    if (stored) {
      setStoredKeyShare(stored);
      setKeysGenerated(true);
      setHasThreeParties(stored.hasThreeParties);
      setKeyType(stored.keyType);
      // Restore tssVerifierId so server can find the share
      if (stored.tssVerifierId) {
        setTssVerifierId(stored.tssVerifierId);
      }
      // Restore the key to partyKeysRef
      partyKeysRef.current = {
        id: stored.partyId,
        key: deserializeKey(stored),
        keyType: stored.keyType,
      };
      setStatus('Key share loaded');
      setStatusType('success');
    }
  }, []);

  const handleQrCancel = useCallback(() => {
    cancelledRef.current = true;
    if (startConnectionRef.current) {
      startConnectionRef.current.reject(new Error('Cancelled'));
      startConnectionRef.current = null;
    }
    setQrData(null);
    setIsLoading(false);
    setStatus('Cancelled');
    setStatusType('info');
  }, []);

  const handleQrStart = useCallback(() => {
    if (startConnectionRef.current) {
      startConnectionRef.current.resolve();
      startConnectionRef.current = null;
    }
  }, []);

  const waitForUserStart = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      startConnectionRef.current = { resolve, reject };
    });
  }, []);

  // DELETE KEY
  const handleDeleteKey = useCallback(() => {
    deleteKeyShare();
    setStoredKeyShare(null);
    partyKeysRef.current = null;
    setKeysGenerated(false);
    setHasThreeParties(false);
    setStatus('Key deleted');
    setStatusType('info');
    addLog('Key share deleted from storage');
  }, [addLog]);

  // CREATE KEY
  const handleCreateKey = useCallback(async () => {
    setIsLoading(true);
    clearLogs();
    setStatus('Creating key...');
    setStatusType('info');
    addLog(`Creating ${keyType} key...`);

    try {
      const rng = new BrowserRandomNumberGenerator();
      const dkg = initCL24DKG(keyType, rng);
      const custodians = [SERVER_PARTY_ID, CLIENT_PARTY_ID];
      const threshold = 2;
      const shareIndexes = initShareIndexes(custodians.length);
      const sessionId = createSessionId();

      const transport = await createTransport(CLIENT_PARTY_ID, centrifugeUrl);
      const networkSession = await createSession(
        sessionId,
        CLIENT_PARTY_ID,
        custodians,
        transport,
        true,
      );

      addLog('Connecting to server...');
      const serverPromise = fetch(`${serverUrl}/v1/mpc/create-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tssVerifierId,
          sessionId,
          keyType,
          custodians,
          shareIndexes,
        }),
      });

      await new Promise((r) => setTimeout(r, 500));
      addLog('E2E encryption handshake...');

      const initEncryption = networkSession.initializeEncryption;
      if (initEncryption) {
        await initEncryption.call(networkSession);
      }

      addLog('Running key generation protocol...');
      const [clientKey] = await Promise.all([
        dkg.createKey({ custodians, shareIndexes, threshold, networkSession }),
        serverPromise.then((r) => {
          if (!r.ok) {
            throw new Error(`Server error: ${r.status}`);
          }
        }),
      ]);

      partyKeysRef.current = { id: CLIENT_PARTY_ID, key: clientKey, keyType };
      setKeysGenerated(true);
      setHasThreeParties(false);

      // Save to localStorage (including tssVerifierId for server lookup)
      try {
        saveKeyShare(
          clientKey,
          keyType,
          CLIENT_PARTY_ID as '2',
          false,
          tssVerifierId,
        );
        setStoredKeyShare(loadKeyShare());
      } catch {
        // Storage error - key still works in memory
      }

      const pkHex = clientKey.publicKey
        ? Buffer.from(clientKey.publicKey).toString('hex').substring(0, 16)
        : 'N/A';
      addLog(`Public key: ${pkHex}...`);
      setStatus('Key created!');
      setStatusType('success');
      await networkSession.disconnect();
    } catch (e) {
      addLog(`✗ ${e instanceof Error ? e.message : 'Error'}`);
      setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown'}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  }, [keyType, centrifugeUrl, serverUrl, tssVerifierId, addLog, clearLogs]);

  // SIGN MESSAGE
  const handleSign = useCallback(async () => {
    if (!partyKeysRef.current) {
      setStatus('No keys');
      setStatusType('error');
      return;
    }

    const selectedParties: string[] = [];
    if (signingParties.party1) {
      selectedParties.push(SERVER_PARTY_ID);
    }
    if (signingParties.party2) {
      selectedParties.push(CLIENT_PARTY_ID);
    }
    if (signingParties.party3) {
      selectedParties.push(NEW_PARTY_ID);
    }

    if (selectedParties.length !== 2) {
      setStatus('Select exactly 2 parties');
      setStatusType('warning');
      return;
    }

    const needsMobile = signingParties.party3 && hasThreeParties;

    setIsLoading(true);
    clearLogs();
    cancelledRef.current = false;
    setStatus('Signing...');
    setStatusType('info');

    const localKey = partyKeysRef.current;
    const storedKeyType = localKey.keyType;
    const useServer = selectedParties.includes(SERVER_PARTY_ID);

    addLog(`Signing with ${signingProtocol.toUpperCase()}...`);

    try {
      const rng = new BrowserRandomNumberGenerator();
      const tssLib = await initTSSLibrary(signingProtocol, rng);
      const message = new TextEncoder().encode('Hello, MPC World!');
      const sessionId = createSessionId();

      // Show QR for mobile
      if (needsMobile) {
        const qrPayload: SignQRPayload = {
          t: 's',
          s: sessionId,
          p: signingProtocol,
          m: Array.from(message.slice(0, 8)),
        };
        setQrData(JSON.stringify(qrPayload));
        setQrTitle('Sign with Mobile');
        setQrSubtitle(
          '1. Scan QR with mobile app\n2. Click Connect when ready',
        );
        setQrStatus('waiting');
        setQrStatusMessage('');
        addLog('Waiting for mobile...');

        await waitForUserStart();
        if (cancelledRef.current) {
          return;
        }

        setQrStatus('connecting');
        setQrStatusMessage('Connecting...');
        addLog('Connecting...');
      }

      const transport = await createTransport(CLIENT_PARTY_ID, centrifugeUrl);
      if (cancelledRef.current) {
        return;
      }

      const networkSession = await createSession(
        sessionId,
        CLIENT_PARTY_ID,
        selectedParties,
        transport,
        true,
      );

      if (cancelledRef.current) {
        await networkSession.disconnect();
        return;
      }

      let serverPromise: Promise<Response> | null = null;
      if (useServer) {
        serverPromise = fetch(`${serverUrl}/v1/mpc/sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protocol: signingProtocol,
            tssVerifierId,
            sessionId,
            custodians: selectedParties,
            publicKey: Array.from(localKey.key.publicKey),
            keyType: storedKeyType,
            message: Array.from(message),
          }),
        });
      }

      await new Promise((r) => setTimeout(r, 500));

      if (needsMobile) {
        setQrStatusMessage('E2E encryption...');
      }
      addLog('E2E encryption handshake...');

      // Encryption handshake - waits for other party
      const initEncryption = networkSession.initializeEncryption;
      if (initEncryption) {
        await initEncryption.call(networkSession);
      }

      // Close QR when connected
      if (needsMobile) {
        setQrStatus('connected');
        setQrStatusMessage('Connected!');
        await new Promise((r) => setTimeout(r, 500));
        setQrData(null);
      }

      if (cancelledRef.current) {
        await networkSession.disconnect();
        return;
      }

      addLog('Running signing protocol...');
      const signPromise = tssLib.sign({
        key: localKey.key,
        signers: selectedParties,
        message,
        networkSession,
      });

      const promises: Promise<unknown>[] = [signPromise];
      if (serverPromise) {
        promises.push(
          serverPromise.then((r) => {
            if (!r.ok) {
              throw new Error(`Server error: ${r.status}`);
            }
          }),
        );
      }

      const [signResult] = (await Promise.all(promises)) as [
        { signature: Uint8Array },
      ];
      const sigBytes = signResult.signature;

      const sigHex = Buffer.from(sigBytes).toString('hex').substring(0, 16);
      addLog(`Signature: ${sigHex}...`);

      const isValid =
        storedKeyType === 'secp256k1'
          ? await verifyEcdsaSignature(
              sigBytes,
              message,
              localKey.key.publicKey,
            )
          : await verifySchnorrSignature(
              sigBytes,
              message,
              localKey.key.publicKey,
            );

      if (isValid) {
        addLog('✓ Signature verified');
        setStatus('Signed & verified!');
        setStatusType('success');
      } else {
        addLog('⚠ Verification failed');
        setStatus('Signed (verification failed)');
        setStatusType('warning');
      }

      await networkSession.disconnect();
    } catch (e) {
      setQrData(null);
      if ((e as Error).message !== 'Cancelled') {
        addLog(`✗ ${e instanceof Error ? e.message : 'Error'}`);
        setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown'}`);
        setStatusType('error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    signingParties,
    signingProtocol,
    hasThreeParties,
    centrifugeUrl,
    serverUrl,
    tssVerifierId,
    addLog,
    clearLogs,
    waitForUserStart,
  ]);

  // UPDATE KEY (Add Mobile as Party 3)
  const handleUpdateKey = useCallback(async () => {
    if (!partyKeysRef.current) {
      setStatus('No keys');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    clearLogs();
    cancelledRef.current = false;
    setStatus('Adding mobile as Party 3...');
    setStatusType('info');

    const clientKey = partyKeysRef.current.key;
    const storedKeyType = partyKeysRef.current.keyType;

    addLog('Adding Party 3 (2-of-2 → 2-of-3)...');

    try {
      const rng = new BrowserRandomNumberGenerator();
      const dkg = initCL24DKG(storedKeyType, rng);

      const onlineCustodians = [SERVER_PARTY_ID, CLIENT_PARTY_ID];
      const newCustodians = [SERVER_PARTY_ID, CLIENT_PARTY_ID, NEW_PARTY_ID];
      const newShareIndexes = initShareIndexes(newCustodians.length);
      const sessionId = createSessionId();

      // Show QR for mobile
      const qrPayload: UpdateKeyQRPayload = {
        t: 'u',
        s: sessionId,
        k: storedKeyType,
        p: Array.from(clientKey.publicKey),
        i: newShareIndexes,
      };
      setQrData(JSON.stringify(qrPayload));
      setQrTitle('Add Mobile as Party 3');
      setQrSubtitle('1. Scan QR with mobile app\n2. Click Connect when ready');
      setQrStatus('waiting');
      setQrStatusMessage('');
      addLog('Waiting for mobile...');

      await waitForUserStart();
      if (cancelledRef.current) {
        return;
      }

      setQrStatus('connecting');
      setQrStatusMessage('Connecting...');
      addLog('Connecting...');

      const transport = await createTransport(CLIENT_PARTY_ID, centrifugeUrl);
      if (cancelledRef.current) {
        return;
      }

      const networkSession = await createSession(
        sessionId,
        CLIENT_PARTY_ID,
        newCustodians,
        transport,
        true,
      );

      if (cancelledRef.current) {
        await networkSession.disconnect();
        return;
      }

      const serverPromise = fetch(`${serverUrl}/v1/mpc/update-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tssVerifierId,
          sessionId,
          keyType: storedKeyType,
          custodians: onlineCustodians,
          newCustodians,
          shareIndexes: newShareIndexes,
          publicKey: Array.from(clientKey.publicKey),
        }),
      });

      await new Promise((r) => setTimeout(r, 500));
      setQrStatusMessage('E2E encryption...');
      addLog('E2E encryption handshake...');

      const initEncryption = networkSession.initializeEncryption;
      if (initEncryption) {
        await initEncryption.call(networkSession);
      }

      // Close QR
      setQrStatus('connected');
      setQrStatusMessage('Connected!');
      await new Promise((r) => setTimeout(r, 500));
      setQrData(null);

      if (cancelledRef.current) {
        await networkSession.disconnect();
        return;
      }

      addLog('Running key update protocol...');
      const [updatedKey] = await Promise.all([
        dkg.updateKey({
          key: clientKey,
          onlineCustodians,
          newCustodians,
          networkSession,
        }),
        serverPromise.then((r) => {
          if (!r.ok) {
            throw new Error(`Server error: ${r.status}`);
          }
        }),
      ]);

      partyKeysRef.current = {
        id: CLIENT_PARTY_ID,
        key: updatedKey,
        keyType: storedKeyType,
      };
      setHasThreeParties(true);
      setSigningParties({ party1: true, party2: true, party3: false });

      // Update localStorage (preserve tssVerifierId)
      try {
        saveKeyShare(
          updatedKey,
          storedKeyType,
          CLIENT_PARTY_ID as '2',
          true,
          tssVerifierId,
        );
        setStoredKeyShare(loadKeyShare());
      } catch {
        // Storage error - key still works in memory
      }

      setStatus('Mobile added as Party 3!');
      setStatusType('success');
      addLog('✓ Now 2-of-3 threshold');

      await networkSession.disconnect();
    } catch (e) {
      setQrData(null);
      if ((e as Error).message !== 'Cancelled') {
        addLog(`✗ ${e instanceof Error ? e.message : 'Error'}`);
        setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown'}`);
        setStatusType('error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    centrifugeUrl,
    serverUrl,
    tssVerifierId,
    addLog,
    clearLogs,
    waitForUserStart,
  ]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: '420px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '3px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
            }}
          >
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>
              MPC
            </span>
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#fff',
              margin: '0 0 8px',
            }}
          >
            MPC Wallet
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Party 2 · Extension
          </p>
        </div>

        {/* Key Share Card */}
        <KeyShareCard
          keyShare={storedKeyShare}
          onDelete={handleDeleteKey}
          disabled={isLoading}
        />

        {/* Status */}
        {(isLoading || statusType !== 'info' || status !== 'Ready') && (
          <StatusDisplay
            status={status}
            type={statusType}
            isLoading={isLoading}
          />
        )}

        {/* Main Actions */}
        {keysGenerated ? (
          <>
            {/* Protocol & Party Selection */}
            <SigningProtocolSelector
              value={signingProtocol}
              onChange={setSigningProtocol}
              keyType={partyKeysRef.current?.keyType ?? keyType}
              disabled={isLoading}
            />

            <PartySelector
              parties={signingParties}
              onChange={setSigningParties}
              hasThreeParties={hasThreeParties}
              disabled={isLoading}
            />

            {/* Sign Button */}
            <button
              type="button"
              onClick={handleSign}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                marginBottom: '12px',
              }}
            >
              Sign Message
            </button>

            {/* Add Mobile Button */}
            {!hasThreeParties && (
              <button
                type="button"
                onClick={handleUpdateKey}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#3a3a4e',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                  marginBottom: '12px',
                }}
              >
                Add Mobile (Party 3)
              </button>
            )}
          </>
        ) : (
          <>
            <KeyTypeSelector
              value={keyType}
              onChange={setKeyType}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleCreateKey}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                marginBottom: '12px',
              }}
            >
              {isLoading ? 'Creating...' : 'Create Key'}
            </button>
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px' }}>
            {hasThreeParties
              ? '2-of-3 Threshold Signature Scheme'
              : '2-of-2 Threshold Signature Scheme'}
          </p>
          <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>
            Your device holds one of {hasThreeParties ? 'three' : 'two'} key
            shares
          </p>
        </div>

        {/* Activity Log */}
        <details
          style={{
            marginTop: '24px',
            background: '#1e1e2f',
            borderRadius: '12px',
            border: '1px solid #3a3a4e',
          }}
        >
          <summary
            style={{
              padding: '14px 16px',
              color: '#9ca3af',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Activity Log
          </summary>
          <div style={{ padding: '0 16px 16px' }}>
            <LogViewer logs={logs} maxHeight="200px" />
          </div>
        </details>

        {/* Configuration */}
        <details
          style={{
            marginTop: '12px',
            background: '#1e1e2f',
            borderRadius: '12px',
            border: '1px solid #3a3a4e',
          }}
        >
          <summary
            style={{
              padding: '14px 16px',
              color: '#9ca3af',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Configuration
          </summary>
          <div style={{ padding: '0 16px 16px' }}>
            <ConfigInputs
              config={{ centrifugeUrl, serverUrl, tssVerifierId }}
              onChange={({
                centrifugeUrl: c,
                serverUrl: s,
                tssVerifierId: t,
              }) => {
                setCentrifugeUrl(c);
                setServerUrl(s);
                setTssVerifierId(t);
              }}
              disabled={isLoading}
            />
          </div>
        </details>
      </div>

      {qrData && (
        <QRCodeDisplay
          data={qrData}
          title={qrTitle}
          subtitle={qrSubtitle}
          onCancel={handleQrCancel}
          onStart={handleQrStart}
          status={qrStatus}
          statusMessage={qrStatusMessage}
        />
      )}
    </div>
  );
};

export default MpcPage;
