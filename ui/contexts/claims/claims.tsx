import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import {
  ShieldClaim,
  CLAIM_STATUS,
  ClaimStatus,
} from '../../pages/settings/transaction-shield-tab/types';
import { getShieldClaims } from '../../store/actions';

type ClaimsContextType = {
  claims: ShieldClaim[];
  pendingClaims: ShieldClaim[];
  historyClaims: ShieldClaim[];
  isLoading: boolean;
  error: Error | null;
  refetchClaims: () => Promise<void>;
};

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined);

type ClaimsProviderProps = {
  children: ReactNode;
};

const PENDING_CLAIM_STATUSES = [
  CLAIM_STATUS.CREATED,
  CLAIM_STATUS.SUBMITTED,
  CLAIM_STATUS.IN_PROGRESS,
  CLAIM_STATUS.WAITING_FOR_CUSTOMER,
] as ClaimStatus[];

export const ClaimsProvider: React.FC<ClaimsProviderProps> = ({ children }) => {
  const [claims, setClaims] = useState<ShieldClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClaims = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const claimsData = await getShieldClaims();
      // sort claims by createdAt descending
      const sortedClaims = claimsData
        .sort((a: ShieldClaim, b: ShieldClaim) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        })
        .map((claim: ShieldClaim, index: number) => ({
          ...claim,
          // used for displaying list of claims
          claimNumber: index + 1,
          // change chainId from number to hex
          chainId: `0x${Number(claim.chainId).toString(16)}`,
        }));
      setClaims(sortedClaims);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const pendingClaims = useMemo(() => {
    return claims.filter((claim) =>
      PENDING_CLAIM_STATUSES.includes(claim.status),
    );
  }, [claims]);

  const historyClaims = useMemo(() => {
    return claims.filter(
      (claim) => !PENDING_CLAIM_STATUSES.includes(claim.status),
    );
  }, [claims]);

  const value = useMemo(
    () => ({
      claims,
      pendingClaims,
      historyClaims,
      isLoading,
      error,
      refetchClaims: fetchClaims,
    }),
    [claims, pendingClaims, historyClaims, isLoading, error, fetchClaims],
  );

  return (
    <ClaimsContext.Provider value={value}>{children}</ClaimsContext.Provider>
  );
};

export const useClaims = (): ClaimsContextType => {
  const context = useContext(ClaimsContext);
  if (context === undefined) {
    throw new Error('useClaims must be used within a ClaimsProvider');
  }
  return context;
};
