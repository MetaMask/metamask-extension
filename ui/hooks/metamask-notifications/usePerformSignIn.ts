import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsSignedIn } from '../../selectors/metamask-notifications/authentication';
import { performSignIn } from '../../store/actions';

export function usePerformSignIn() {
  const dispatch = useDispatch();
  const isSignedIn = useSelector(selectIsSignedIn);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setLoading(true);
    try {
      await dispatch(performSignIn());
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : JSON.stringify(e ?? '');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return {
    handleSignIn,
    isSignedIn,
    loading,
    error,
  };
}
