import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classnames from 'classnames';
import { debounce } from 'lodash';
import { Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import { useHistory, useLocation } from 'react-router-dom';
import {
  setDestTokenExchangeRates,
  setFromChain,
  setFromToken,
  setFromTokenInputValue,
  setSrcTokenExchangeRates,
  setSelectedQuote,
  setToChain,
  setToChainId,
  setToToken,
  updateQuoteRequestParams,
} from '../../../ducks/bridge/actions';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromChains,
  getFromToken,
  getFromTokens,
  getFromTopAssets,
  getQuoteRequest,
  getToChain,
  getToChains,
  getToToken,
  getToTokens,
  getToTopAssets,
} from '../../../ducks/bridge/selectors';
import {
  Box,
  ButtonIcon,
  IconName,
} from '../../../components/component-library';
import { BlockSize } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TokenBucketPriority } from '../../../../shared/constants/swaps';
import { useTokensWithFiltering } from '../../../hooks/useTokensWithFiltering';
import { setActiveNetwork } from '../../../store/actions';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { QuoteRequest } from '../types';
import { calcTokenValue } from '../../../../shared/lib/swaps-utils';
import { BridgeQuoteCard } from '../quotes/bridge-quote-card';
import { isValidQuoteRequest } from '../utils/quote';
import { getProviderConfig } from '../../../../shared/modules/selectors/networks';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { SECOND } from '../../../../shared/constants/time';
import { BridgeInputGroup } from './bridge-input-group';

const PrepareBridgePage = () => {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const currency = useSelector(getCurrentCurrency);

  const fromToken = useSelector(getFromToken);
  const fromTokens = useSelector(getFromTokens);
  const fromTopAssets = useSelector(getFromTopAssets);

  const toToken = useSelector(getToToken);
  const toTokens = useSelector(getToTokens);
  const toTopAssets = useSelector(getToTopAssets);

  const fromChains = useSelector(getFromChains);
  const toChains = useSelector(getToChains);
  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);

  const fromAmount = useSelector(getFromAmount);

  const providerConfig = useSelector(getProviderConfig);

  const quoteRequest = useSelector(getQuoteRequest);
  const { activeQuote } = useSelector(getBridgeQuotes);

  const fromTokenListGenerator = useTokensWithFiltering(
    fromTokens,
    fromTopAssets,
    TokenBucketPriority.owned,
    fromChain?.chainId,
  );
  const toTokenListGenerator = useTokensWithFiltering(
    toTokens,
    toTopAssets,
    TokenBucketPriority.top,
    toChain?.chainId,
  );

  const [rotateSwitchTokens, setRotateSwitchTokens] = useState(false);

  const quoteParams = useMemo(
    () => ({
      srcTokenAddress: fromToken?.address,
      destTokenAddress: toToken?.address || undefined,
      srcTokenAmount:
        fromAmount && fromAmount !== '' && fromToken?.decimals
          ? calcTokenValue(fromAmount, fromToken.decimals).toString()
          : undefined,
      srcChainId: fromChain?.chainId
        ? Number(hexToDecimal(fromChain.chainId))
        : undefined,
      destChainId: toChain?.chainId
        ? Number(hexToDecimal(toChain.chainId))
        : undefined,
      // This override allows quotes to be returned when the rpcUrl is a tenderly fork
      // Otherwise quotes get filtered out by the bridge-api when the wallet's real
      // balance is less than the tenderly balance
      insufficientBal: Boolean(providerConfig?.rpcUrl?.includes('tenderly')),
    }),
    [
      fromToken,
      toToken,
      fromChain?.chainId,
      toChain?.chainId,
      fromAmount,
      providerConfig,
    ],
  );

  const debouncedUpdateQuoteRequestInController = useCallback(
    debounce((p: Partial<QuoteRequest>) => {
      dispatch(updateQuoteRequestParams(p));
      dispatch(setSelectedQuote(null));
    }, 300),
    [],
  );

  useEffect(() => {
    debouncedUpdateQuoteRequestInController(quoteParams);
  }, Object.values(quoteParams));

  const debouncedFetchFromExchangeRate = debounce(
    (chainId: Hex, tokenAddress: string) => {
      dispatch(setSrcTokenExchangeRates({ chainId, tokenAddress, currency }));
    },
    SECOND,
  );

  const debouncedFetchToExchangeRate = debounce(
    (chainId: Hex, tokenAddress: string) => {
      dispatch(setDestTokenExchangeRates({ chainId, tokenAddress, currency }));
    },
    SECOND,
  );

  const { search } = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (!fromChain?.chainId || Object.keys(fromTokens).length === 0) {
      return;
    }

    const searchParams = new URLSearchParams(search);
    const tokenAddressFromUrl = searchParams.get('token');
    if (!tokenAddressFromUrl) {
      return;
    }

    const removeTokenFromUrl = () => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('token');
      history.replace({
        search: newParams.toString(),
      });
    };

    switch (tokenAddressFromUrl) {
      case fromToken?.address?.toLowerCase():
        // If the token is already set, remove the query param
        removeTokenFromUrl();
        break;
      case fromTokens[tokenAddressFromUrl]?.address?.toLowerCase(): {
        // If there is a matching fromToken, set it as the fromToken
        const matchedToken = fromTokens[tokenAddressFromUrl];
        dispatch(setFromToken(matchedToken));
        debouncedFetchFromExchangeRate(fromChain.chainId, matchedToken.address);
        removeTokenFromUrl();
        break;
      }
      default:
        // Otherwise remove query param
        removeTokenFromUrl();
        break;
    }
  }, [fromChain, fromToken, fromTokens, search]);

  return (
    <div className="prepare-bridge-page">
      <Box className="prepare-bridge-page__content">
        <BridgeInputGroup
          className="bridge-box"
          header={t('bridgeFrom')}
          token={fromToken}
          onAmountChange={(e) => {
            dispatch(setFromTokenInputValue(e));
          }}
          onAssetChange={(token) => {
            dispatch(setFromToken(token));
            dispatch(setFromTokenInputValue(null));
            fromChain?.chainId &&
              token?.address &&
              debouncedFetchFromExchangeRate(fromChain.chainId, token.address);
          }}
          networkProps={{
            network: fromChain,
            networks: fromChains,
            onNetworkChange: (networkConfig) => {
              dispatch(
                setActiveNetwork(
                  networkConfig.rpcEndpoints[
                    networkConfig.defaultRpcEndpointIndex
                  ].networkClientId,
                ),
              );
              dispatch(setFromChain(networkConfig.chainId));
              dispatch(setFromToken(null));
              dispatch(setFromTokenInputValue(null));
            },
          }}
          customTokenListGenerator={
            fromTokens && fromTopAssets ? fromTokenListGenerator : undefined
          }
          amountFieldProps={{
            testId: 'from-amount',
            autoFocus: true,
            value: fromAmount || undefined,
          }}
        />

        <Box className="prepare-bridge-page__switch-tokens">
          <ButtonIcon
            iconProps={{
              className: classnames({
                rotate: rotateSwitchTokens,
              }),
            }}
            width={BlockSize.Full}
            data-testid="switch-tokens"
            ariaLabel="switch-tokens"
            iconName={IconName.Arrow2Down}
            disabled={!isValidQuoteRequest(quoteRequest, false)}
            onClick={() => {
              setRotateSwitchTokens(!rotateSwitchTokens);
              const toChainClientId =
                toChain?.defaultRpcEndpointIndex !== undefined &&
                toChain?.rpcEndpoints
                  ? toChain.rpcEndpoints[toChain.defaultRpcEndpointIndex]
                      .networkClientId
                  : undefined;
              toChainClientId && dispatch(setActiveNetwork(toChainClientId));
              toChain && dispatch(setFromChain(toChain.chainId));
              dispatch(setFromToken(toToken));
              dispatch(setFromTokenInputValue(null));
              fromChain?.chainId && dispatch(setToChain(fromChain.chainId));
              fromChain?.chainId && dispatch(setToChainId(fromChain.chainId));
              dispatch(setToToken(fromToken));
              fromChain?.chainId &&
                fromToken?.address &&
                debouncedFetchToExchangeRate(
                  fromChain.chainId,
                  fromToken.address,
                );
              toChain?.chainId &&
                toToken?.address &&
                toToken.address !== zeroAddress() &&
                debouncedFetchFromExchangeRate(
                  toChain.chainId,
                  toToken.address,
                );
            }}
          />
        </Box>

        <BridgeInputGroup
          className="bridge-box"
          header={t('bridgeTo')}
          token={toToken}
          onAssetChange={(token) => {
            dispatch(setToToken(token));
            toChain?.chainId &&
              token?.address &&
              debouncedFetchToExchangeRate(toChain.chainId, token.address);
          }}
          networkProps={{
            network: toChain,
            networks: toChains,
            onNetworkChange: (networkConfig) => {
              dispatch(setToChainId(networkConfig.chainId));
              dispatch(setToChain(networkConfig.chainId));
            },
          }}
          customTokenListGenerator={
            toChain && toTokens && toTopAssets
              ? toTokenListGenerator
              : fromTokenListGenerator
          }
          amountFieldProps={{
            testId: 'to-amount',
            readOnly: true,
            disabled: true,
            value: activeQuote?.toTokenAmount?.amount.toFixed() ?? '0',
            className: activeQuote?.toTokenAmount.amount
              ? 'amount-input defined'
              : 'amount-input',
          }}
        />
      </Box>
      <BridgeQuoteCard />
    </div>
  );
};

export default PrepareBridgePage;
