import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { syncSeedPhrases } from '../../store/actions';

export const useSyncSRPs = () => {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await dispatch(syncSeedPhrases());
      } catch (error) {
        console.error('[useSyncSRPs] error', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  return { loading };
};
