import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  type RampsToken,
  type TokensResponse,
} from '@metamask/ramps-controller';
import { selectTokens } from '../../selectors/rampsController';
import { setRampsSelectedToken } from '../../store/controller-actions/ramps-controller';
import { parseUserFacingError } from './utils/parseUserFacingError';

export type UseRampsTokensResult = {
  tokens: TokensResponse | null;
  selectedToken: RampsToken | null;
  setSelectedToken: (assetId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

export function useRampsTokens(): UseRampsTokensResult {
  const tokensState = useSelector(selectTokens);
  const {
    data: tokens,
    selected: selectedToken,
    isLoading,
    error,
  } = tokensState;

  const setSelectedToken = useCallback(
    (assetId: string) => setRampsSelectedToken(assetId),
    [],
  );

  return {
    tokens,
    selectedToken,
    setSelectedToken,
    isLoading,
    error: error
      ? parseUserFacingError(tokensState, 'Failed to load tokens')
      : null,
  };
}

export default useRampsTokens;
