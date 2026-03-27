import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { DialProfile } from '@dial-wtf/sdk';
import { setProfile } from '../ducks/dial';
import { getDialProfileByAddress, getDialIsAuthenticated } from '../selectors/dial';
import { useDialClient } from './useDialClient';

/**
 * Hook to fetch and cache a Dial profile for a given wallet address.
 *
 * Returns the profile (from cache or fresh fetch), loading state, and
 * the ENS name if available.
 */
export function useDialProfile(address: string | undefined): {
  profile: DialProfile | undefined;
  ensName: string | undefined;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const dispatch = useDispatch();
  const { userDialer } = useDialClient();
  const isAuthenticated = useSelector(getDialIsAuthenticated);
  const cachedProfile = useSelector((state: any) =>
    address ? getDialProfileByAddress(state, address) : undefined,
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userDialer || !address) {
      return;
    }
    try {
      setIsLoading(true);
      const profile = await userDialer.profile.getProfile({
        walletAddress: address as `0x${string}`,
      });
      dispatch(setProfile(profile));
    } catch {
      // Profile not found or fetch failed
    } finally {
      setIsLoading(false);
    }
  }, [userDialer, address, dispatch]);

  // Fetch profile when authenticated and address is provided
  useEffect(() => {
    if (isAuthenticated && address && !cachedProfile) {
      fetchProfile();
    }
  }, [isAuthenticated, address, cachedProfile, fetchProfile]);

  const ensName = cachedProfile?.links?.ens ?? undefined;

  return {
    profile: cachedProfile,
    ensName,
    isLoading,
    refetch: fetchProfile,
  };
}
