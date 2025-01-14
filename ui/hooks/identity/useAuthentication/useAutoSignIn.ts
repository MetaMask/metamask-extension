import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import log from 'loglevel';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../ducks/metamask/metamask';
import { performSignIn } from '../../../store/actions';
import { useSignIn } from './useSignIn';

/**
 * Custom hook to manage automatically signing in a user based on the app state.
 *
 * @returns An object containing:
 * - `autoSignIn`: A function to automatically sign in the user if necessary.
 * - `shouldAutoSignIn`: A function to determine if the user should be automatically signed in.
 */
export function useAutoSignIn(): {
  autoSignIn: () => Promise<void>;
  shouldAutoSignIn: () => boolean;
} {
  const dispatch = useDispatch();

  const isUnlocked: boolean | undefined = useSelector(getIsUnlocked);
  const completedOnboarding: boolean | undefined = useSelector(
    getCompletedOnboarding,
  );

  const { shouldSignIn } = useSignIn();

  const shouldAutoSignIn = useCallback(() => {
    return Boolean(shouldSignIn() && isUnlocked && completedOnboarding);
  }, [shouldSignIn, isUnlocked, completedOnboarding]);

  const autoSignIn = useCallback(async () => {
    if (shouldAutoSignIn()) {
      try {
        await dispatch(performSignIn());
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        log.error(errorMessage);
      }
    }
  }, [dispatch, shouldAutoSignIn]);

  return {
    autoSignIn,
    shouldAutoSignIn,
  };
}
