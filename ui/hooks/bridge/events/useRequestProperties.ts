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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const token_symbol_source = fromToken?.symbol;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const token_symbol_destination = toToken?.symbol;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const token_address_source = srcTokenAddress;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id_source: formatChainIdToCaip(srcChainId),
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id_destination: formatChainIdToCaip(destChainId),
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol_source,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol_destination,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_address_source,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_address_destination,
      },
      flippedRequestProperties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id_source: formatChainIdToCaip(destChainId),
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id_destination: formatChainIdToCaip(srcChainId),
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol_source: token_symbol_destination,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol_destination: token_symbol_source,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_address_source: token_address_destination,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_address_destination: token_address_source,
      },
    };
  }

  return {};
};
