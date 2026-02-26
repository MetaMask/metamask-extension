import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import { numberToHex } from '@metamask/utils';
import { Claim, ClaimStatusEnum } from '@metamask/claims-controller';
import { getShieldClaims } from '../../store/actions';

type ClaimsContextType = {
  claims: Claim[];
  pendingClaims: Claim[];
  completedClaims: Claim[];
  rejectedClaims: Claim[];
  isLoading: boolean;
  error: Error | null;
  refetchClaims: () => Promise<void>;
};

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined);

type ClaimsProviderProps = {
  children: ReactNode;
};

const PENDING_CLAIM_STATUSES = [
  ClaimStatusEnum.CREATED,
  ClaimStatusEnum.SUBMITTED,
  ClaimStatusEnum.IN_PROGRESS,
  ClaimStatusEnum.WAITING_FOR_CUSTOMER,
] as ClaimStatusEnum[];

export const ClaimsProvider: React.FC<ClaimsProviderProps> = ({ children }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClaims = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const claimsData = await getShieldClaims();
      // sort claims by createdAt descending
      const sortedClaims = claimsData
        .sort((a: Claim, b: Claim) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        })
        .map((claim: Claim) => {
          const numberChain = Number(claim.chainId);
          const chainId = isNaN(numberChain) ? '' : numberToHex(numberChain);
          return {
            ...claim,
            chainId,
          };
        });
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

  const completedClaims = useMemo(() => {
    return claims.filter((claim) => claim.status === ClaimStatusEnum.APPROVED);
  }, [claims]);

  const rejectedClaims = useMemo(() => {
    return claims.filter((claim) => claim.status === ClaimStatusEnum.REJECTED);
  }, [claims]);

  const value = useMemo(
    () => ({
      claims,
      pendingClaims,
      completedClaims,
      rejectedClaims,
      isLoading,
      error,
      refetchClaims: fetchClaims,
    }),
    [
      claims,
      pendingClaims,
      completedClaims,
      rejectedClaims,
      isLoading,
      error,
      fetchClaims,
    ],
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
