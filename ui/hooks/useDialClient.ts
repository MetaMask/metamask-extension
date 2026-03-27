import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DialClient, UserDialer } from '@dial-wtf/sdk';
import type { SessionData } from '@dial-wtf/sdk';
import {
  setAuthenticated,
  setAuthenticating,
  setUnauthenticated,
  setAuthError,
} from '../ducks/dial';
import { getDialIsAuthenticated } from '../selectors/dial';
import { getSelectedInternalAccount } from '../selectors/accounts';

const DIAL_SESSION_KEY = 'dial_session';
const DIAL_API_KEY = process.env.DIAL_API_KEY;

let dialClientSingleton: DialClient | null = null;
let userDialerSingleton: UserDialer | null = null;

function getDialClient(): DialClient {
  if (!dialClientSingleton) {
    dialClientSingleton = new DialClient({
      apiKey: DIAL_API_KEY,
      network: 'alpha',
      debug: process.env.NODE_ENV === 'development',
    });
  }
  return dialClientSingleton;
}

/**
 * Hook to manage DialClient lifecycle and authentication.
 *
 * Returns the authenticated UserDialer instance (or null if not authenticated),
 * plus methods to authenticate and logout.
 */
export function useDialClient(): {
  dial: DialClient;
  userDialer: UserDialer | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
} {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(getDialIsAuthenticated);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isAuthenticating, setIsAuthenticatingLocal] = useState(false);
  const [userDialer, setUserDialer] = useState<UserDialer | null>(
    userDialerSingleton,
  );
  const dial = getDialClient();
  const restoredRef = useRef(false);

  // Try to restore session on mount
  useEffect(() => {
    if (restoredRef.current || isAuthenticated || !selectedAccount) {
      return;
    }
    restoredRef.current = true;

    const tryRestore = async () => {
      try {
        const raw = localStorage.getItem(DIAL_SESSION_KEY);
        if (!raw) {
          return;
        }
        const session: SessionData = JSON.parse(raw);
        // Only restore if session belongs to current account
        if (
          session.walletAddress?.toLowerCase() !==
          selectedAccount.address?.toLowerCase()
        ) {
          return;
        }
        const restored = await dial.restoreSession(session);
        if (await restored.isSessionValid()) {
          userDialerSingleton = restored;
          setUserDialer(restored);
          dispatch(
            setAuthenticated({
              walletAddress: session.walletAddress,
            }),
          );
        }
      } catch {
        // Session expired or invalid - clean up
        localStorage.removeItem(DIAL_SESSION_KEY);
      }
    };

    tryRestore();
  }, [dial, dispatch, isAuthenticated, selectedAccount]);

  const authenticate = useCallback(async () => {
    if (!selectedAccount?.address) {
      return;
    }
    try {
      setIsAuthenticatingLocal(true);
      dispatch(setAuthenticating());

      const address = selectedAccount.address;

      // Get nonce from Dial
      const nonce = await dial.auth.getNonce(address);

      // Create SIWE message
      const domain = 'dial.wtf';
      const uri = 'https://dial.wtf';
      const issuedAt = new Date().toISOString();
      const chainId = 1; // Ethereum mainnet

      const message = [
        `${domain} wants you to sign in with your Ethereum account:`,
        address,
        '',
        'Sign in to Dial',
        '',
        `URI: ${uri}`,
        `Version: 1`,
        `Chain ID: ${chainId}`,
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
      ].join('\n');

      // Request signature from MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Authenticate with Dial
      const authenticated = await dial.asUser({
        siwe: { message, signature: signature as string },
      });

      // Persist session
      const sessionData = authenticated.exportSession();
      localStorage.setItem(DIAL_SESSION_KEY, JSON.stringify(sessionData));

      userDialerSingleton = authenticated;
      setUserDialer(authenticated);
      dispatch(setAuthenticated({ walletAddress: address }));
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Authentication failed';
      dispatch(setAuthError(msg));
    } finally {
      setIsAuthenticatingLocal(false);
    }
  }, [dial, dispatch, selectedAccount]);

  const logout = useCallback(async () => {
    try {
      if (userDialerSingleton) {
        await userDialerSingleton.logout();
      }
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem(DIAL_SESSION_KEY);
    userDialerSingleton = null;
    setUserDialer(null);
    dispatch(setUnauthenticated());
  }, [dispatch]);

  return {
    dial,
    userDialer,
    isAuthenticated,
    isAuthenticating,
    authenticate,
    logout,
  };
}
