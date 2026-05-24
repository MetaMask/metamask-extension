import { useEffect, useMemo, useState } from 'react';
import type { SimilarAddressMatch } from '@metamask/phishing-controller';
import { checkAddressPoisoning } from '../../../../store/actions';

const EMPTY_MATCHES: SimilarAddressMatch[] = [];

export type AddressPoisoningDetectionResult = {
  isPoisoningSuspect: boolean;
  bestMatch: SimilarAddressMatch | null;
  matches: SimilarAddressMatch[];
  pending: boolean;
};

export function useAddressPoisoningDetection(
  address: string | undefined,
): AddressPoisoningDetectionResult {
  const [matches, setMatches] = useState<SimilarAddressMatch[]>(EMPTY_MATCHES);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!address) {
      setMatches(EMPTY_MATCHES);
      setPending(false);
      return () => {
        cancelled = true;
      };
    }

    setMatches(EMPTY_MATCHES);
    setPending(true);

    checkAddressPoisoning(address)
      .then((addressMatches) => {
        if (!cancelled) {
          setMatches(addressMatches);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMatches(EMPTY_MATCHES);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  return useMemo(
    () => ({
      isPoisoningSuspect: matches.length > 0,
      bestMatch: matches[0] ?? null,
      matches,
      pending,
    }),
    [matches, pending],
  );
}
