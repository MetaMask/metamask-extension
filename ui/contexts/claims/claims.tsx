import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from 'react';
import { ShieldClaim, CLAIM_STATUS } from '../../pages/settings/transaction-shield-tab/types';
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

export const ClaimsProvider: React.FC<ClaimsProviderProps> = ({ children }) => {
  const [claims, setClaims] = useState<ShieldClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClaims = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const claimsData = await getShieldClaims();
      setClaims(claimsData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const pendingClaims = useMemo(() => {
    return claims.filter((claim) => claim.status === CLAIM_STATUS.PENDING);
  }, [claims]);

  const historyClaims = useMemo(() => {
    return claims.filter((claim) => claim.status !== CLAIM_STATUS.PENDING);
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
    [claims, pendingClaims, historyClaims, isLoading, error],
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

