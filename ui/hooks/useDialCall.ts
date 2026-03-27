import { useCallback, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserDialerContext } from '@dial-wtf/react';
import type { Call, CallType } from '@dial-wtf/core';
import { setActiveCall } from '../ducks/dial';
import { getDialActiveCall, getDialIsAuthenticated } from '../selectors/dial';

/**
 * Hook to manage wallet-to-wallet calls via the Dial SDK.
 *
 * Provides methods to start, end, mute/unmute calls and tracks active call state.
 */
export function useDialCall(): {
  activeCall: Call | null;
  isCallActive: boolean;
  isStartingCall: boolean;
  isAuthenticated: boolean;
  startCall: (to: string, type?: CallType) => Promise<Call | null>;
  endCall: () => Promise<void>;
  toggleMute: () => Promise<void>;
} {
  const dispatch = useDispatch();
  const userDialerCtx = useContext(UserDialerContext);
  const userDialer = userDialerCtx?.userDialer ?? null;
  const isAuthenticated = useSelector(getDialIsAuthenticated);
  const activeCall = useSelector(getDialActiveCall);
  const [isStartingCall, setIsStartingCall] = useState(false);

  const startCall = useCallback(
    async (to: string, type: CallType = 'audio'): Promise<Call | null> => {
      if (!userDialer) {
        return null;
      }
      try {
        setIsStartingCall(true);
        const call = await userDialer.calls.start({
          to: to as `0x${string}`,
          type,
        });
        dispatch(setActiveCall(call));
        return call;
      } catch {
        return null;
      } finally {
        setIsStartingCall(false);
      }
    },
    [userDialer, dispatch],
  );

  const endCall = useCallback(async () => {
    if (!userDialer || !activeCall) {
      return;
    }
    try {
      await userDialer.calls.end(activeCall.id);
    } catch {
      // End call failed
    }
    dispatch(setActiveCall(null));
  }, [userDialer, activeCall, dispatch]);

  const toggleMute = useCallback(async () => {
    if (!userDialer || !activeCall) {
      return;
    }
    try {
      await userDialer.calls.toggleMute(activeCall.id);
    } catch {
      // Mute toggle failed
    }
  }, [userDialer, activeCall]);

  return {
    activeCall,
    isCallActive: activeCall !== null,
    isStartingCall,
    isAuthenticated,
    startCall,
    endCall,
    toggleMute,
  };
}
