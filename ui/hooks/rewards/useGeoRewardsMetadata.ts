import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  setRewardsGeoMetadata,
  setRewardsGeoMetadataError,
  setRewardsGeoMetadataLoading,
} from '../../ducks/rewards';
import { getRewardsGeoMetadata } from '../../store/actions';
import { RewardsGeoMetadata } from '../../../shared/types/rewards';

type UseGeoRewardsMetadataProps = {
  enabled?: boolean;
};

type UseGeoRewardsMetadataReturn = {
  fetchGeoRewardsMetadata: () => Promise<void>;
};

/*
 * useGeoRewardsMetadata
 *
 * A custom hook that returns the geo rewards metadata for the current user.
 */
export const useGeoRewardsMetadata = ({
  enabled = true,
}: UseGeoRewardsMetadataProps): UseGeoRewardsMetadataReturn => {
  const dispatch = useDispatch();
  const isLoadingRef = useRef(false);

  const fetchGeoRewardsMetadata = useCallback(async (): Promise<void> => {
    // Skip fetch if already loading (prevents duplicate requests)
    if (isLoadingRef.current || !enabled) {
      if (!enabled) {
        dispatch(setRewardsGeoMetadataError(false));
        dispatch(setRewardsGeoMetadataLoading(false));
        dispatch(setRewardsGeoMetadata(null));
      }
      return;
    }
    isLoadingRef.current = true;
    dispatch(setRewardsGeoMetadataLoading(true));
    dispatch(setRewardsGeoMetadataError(false));

    try {
      const metadata = (await dispatch(
        getRewardsGeoMetadata(),
      )) as unknown as RewardsGeoMetadata | null;

      dispatch(setRewardsGeoMetadata(metadata));
    } catch (err) {
      dispatch(setRewardsGeoMetadataError(true));
    } finally {
      isLoadingRef.current = false;
      dispatch(setRewardsGeoMetadataLoading(false));
    }
  }, [dispatch, enabled]);

  // Initial data fetch
  useEffect(() => {
    fetchGeoRewardsMetadata();
  }, [fetchGeoRewardsMetadata]);

  return { fetchGeoRewardsMetadata };
};
