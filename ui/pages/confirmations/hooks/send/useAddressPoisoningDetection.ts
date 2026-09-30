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
  const [checkedAddress, setCheckedAddress] = useState<string>();
  const [fetchPending, setFetchPending] = useState(() => Boolean(address));
  const [prevAddress, setPrevAddress] = useState(address);

  if (address !== prevAddress) {
    setPrevAddress(address);
    setMatches(EMPTY_MATCHES);
    setCheckedAddress(undefined);
    setFetchPending(Boolean(address));
  }

  useEffect(() => {
    let cancelled = false;

    if (!address) {
      return () => {
        cancelled = true;
      };
    }

    checkAddressPoisoning(address)
      .then((addressMatches) => {
        if (!cancelled) {
          setMatches(
            Array.isArray(addressMatches) ? addressMatches : EMPTY_MATCHES,
          );
          setCheckedAddress(address);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMatches(EMPTY_MATCHES);
          setCheckedAddress(address);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setFetchPending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  const currentAddressMatches =
    address && checkedAddress === address ? matches : EMPTY_MATCHES;
  const isCheckingCurrentAddress =
    Boolean(address) && (fetchPending || checkedAddress !== address);

  return useMemo(
    () => ({
      isPoisoningSuspect: currentAddressMatches.length > 0,
      bestMatch: currentAddressMatches[0] ?? null,
      matches: currentAddressMatches,
      pending: isCheckingCurrentAddress,
    }),
    [currentAddressMatches, isCheckingCurrentAddress],
  );
}
