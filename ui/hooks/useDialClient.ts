import { useCallback, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useAuth,
  useDialClient as useDialClientSDK,
  UserDialerContext,
} from '@dial-wtf/react';
import type { SessionData } from '@dial-wtf/core';
import {
  setAuthenticated,
  setAuthenticating,
  setUnauthenticated,
  setAuthError,
} from '../ducks/dial';
import { getDialIsAuthenticated } from '../selectors/dial';
import { getSelectedInternalAccount } from '../selectors/accounts';

const DIAL_SESSION_KEY = 'dial_session';

/**
 * Hook to manage Dial authentication with session persistence.
 *
 * Wraps the SDK's useAuth() hook, adding:
 * - Session restore from localStorage on mount
 * - Session persistence on login
 * - MetaMask wallet adapter for loginWithWallet()
 * - Redux state sync
 */
export function useDialAuth(): {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
} {
  const dispatch = useDispatch();
  const dialClient = useDialClientSDK();
  const userDialerCtx = useContext(UserDialerContext);
  const {
    loginWithWallet,
    logout: sdkLogout,
    isAuthenticated: sdkIsAuthenticated,
    isLoading,
  } = useAuth();
  const isAuthenticated = useSelector(getDialIsAuthenticated);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const restoredRef = useRef(false);

  // Try to restore session on mount
  useEffect(() => {
    if (restoredRef.current || sdkIsAuthenticated || !selectedAccount) {
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
        if (
          session.walletAddress?.toLowerCase() !==
          selectedAccount.address?.toLowerCase()
        ) {
          return;
        }
        const restored = await dialClient.restoreSession(session);
        if (await restored.isSessionValid()) {
          // Set the UserDialer in the SDK's React context
          userDialerCtx?.setUserDialer(restored);
          dispatch(
            setAuthenticated({
              walletAddress: session.walletAddress,
            }),
          );
        }
      } catch {
        localStorage.removeItem(DIAL_SESSION_KEY);
      }
    };

    tryRestore();
  }, [dialClient, userDialerCtx, dispatch, sdkIsAuthenticated, selectedAccount]);

  // Sync SDK auth state -> Redux
  useEffect(() => {
    if (sdkIsAuthenticated && !isAuthenticated && selectedAccount) {
      dispatch(
        setAuthenticated({ walletAddress: selectedAccount.address }),
      );
    }
  }, [sdkIsAuthenticated, isAuthenticated, selectedAccount, dispatch]);

  const authenticate = useCallback(async () => {
    if (!selectedAccount?.address) {
      return;
    }
    try {
      dispatch(setAuthenticating());

      // Create a wallet adapter for the MetaMask provider
      const wallet = {
        getAddress: async () => selectedAccount.address,
        signMessage: async (message: string) => {
          const signature = await (
            window as unknown as {
              ethereum: {
                request: (args: {
                  method: string;
                  params: string[];
                }) => Promise<string>;
              };
            }
          ).ethereum.request({
            method: 'personal_sign',
            params: [message, selectedAccount.address],
          });
          return signature;
        },
      };

      // loginWithWallet auto-detects domain for extensions (P2-7 fix)
      const userDialer = await loginWithWallet(wallet, 1);

      // Persist session
      const sessionData = userDialer.exportSession();
      localStorage.setItem(DIAL_SESSION_KEY, JSON.stringify(sessionData));

      dispatch(
        setAuthenticated({ walletAddress: selectedAccount.address }),
      );
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Authentication failed';
      dispatch(setAuthError(msg));
    }
  }, [loginWithWallet, dispatch, selectedAccount]);

  const logout = useCallback(async () => {
    try {
      await sdkLogout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem(DIAL_SESSION_KEY);
    dispatch(setUnauthenticated());
  }, [sdkLogout, dispatch]);

  return {
    isAuthenticated: isAuthenticated || sdkIsAuthenticated,
    isAuthenticating: isLoading,
    authenticate,
    logout,
  };
}
