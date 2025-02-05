/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import {
  getQuoteRequest,
  getFromToken,
  getToToken,
} from '../../../ducks/bridge/selectors';
import { formatChainIdFromDecimal } from '../../../../shared/modules/bridge-utils/multichain';

export const useRequestProperties = () => {
  const { srcChainId, destChainId, srcTokenAddress, destTokenAddress } =
    useSelector(getQuoteRequest);
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const chain_id_source = srcChainId && formatChainIdFromDecimal(srcChainId);
  const chain_id_destination =
    destChainId && formatChainIdFromDecimal(destChainId);
  const token_symbol_source = fromToken?.symbol;
  const token_symbol_destination = toToken?.symbol;
  const token_address_source = srcTokenAddress;
  const token_address_destination = destTokenAddress;

  if (
    chain_id_source &&
    chain_id_destination &&
    token_address_source &&
    token_address_destination &&
    token_symbol_source &&
    token_symbol_destination
  ) {
    return {
      quoteRequestProperties: {
        chain_id_source,
        chain_id_destination,
        token_symbol_source,
        token_symbol_destination,
        token_address_source,
        token_address_destination,
      },
      flippedRequestProperties: {
        chain_id_source: chain_id_destination,
        chain_id_destination: chain_id_source,
        token_symbol_source: token_symbol_destination,
        token_symbol_destination: token_symbol_source,
        token_address_source: token_address_destination,
        token_address_destination: token_address_source,
      },
    };
  }

  return {};
};
