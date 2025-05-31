/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  getQuoteRequest,
  getFromToken,
  getToToken,
} from '../../../ducks/bridge/selectors';

export const useRequestProperties = () => {
  const { srcChainId, destChainId, srcTokenAddress, destTokenAddress } =
    useSelector(getQuoteRequest);
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const token_symbol_source = fromToken?.symbol;
  const token_symbol_destination = toToken?.symbol;
  const token_address_source = srcTokenAddress;
  const token_address_destination = destTokenAddress;

  if (
    srcChainId &&
    destChainId &&
    token_address_source &&
    token_address_destination &&
    token_symbol_source &&
    token_symbol_destination
  ) {
    return {
      quoteRequestProperties: {
        chain_id_source: formatChainIdToCaip(srcChainId),
        chain_id_destination: formatChainIdToCaip(destChainId),
        token_symbol_source,
        token_symbol_destination,
        token_address_source,
        token_address_destination,
      },
      flippedRequestProperties: {
        chain_id_source: formatChainIdToCaip(destChainId),
        chain_id_destination: formatChainIdToCaip(srcChainId),
        token_symbol_source: token_symbol_destination,
        token_symbol_destination: token_symbol_source,
        token_address_source: token_address_destination,
        token_address_destination: token_address_source,
      },
    };
  }

  return {};
};
