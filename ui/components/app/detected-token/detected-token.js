import React, { useState, useContext, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { chain } from 'lodash';

import {
  addImportedTokens,
  ignoreTokens,
  setNewTokensImported,
} from '../../../store/actions';
import {
  getCurrentChainId,
  getSelectedNetworkClientId,
  getNetworkConfigurationsByChainId,
} from '../../../../shared/modules/selectors/networks';
import {
  getAllDetectedTokensForSelectedAddress,
  getDetectedTokensInCurrentNetwork,
  getPreferences,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';

import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../shared/constants/metametrics';
import DetectedTokenSelectionPopover from './detected-token-selection-popover/detected-token-selection-popover';
import DetectedTokenIgnoredPopover from './detected-token-ignored-popover/detected-token-ignored-popover';

const sortingBasedOnTokenSelection = (tokensDetected) => {
  return (
    chain(tokensDetected)
      // get the values
      .values()
      // create a new object with keys 'selected', 'deselected' and group the tokens
      .groupBy((token) => (token.selected ? 'selected' : 'deselected'))
      // ditch the 'selected' property and get just the tokens'
      .mapValues((group) =>
        group.map(({ token }) => {
          const { address, symbol, decimals, aggregators, chainId } = token;
          return { address, symbol, decimals, aggregators, chainId };
        }),
      )
      // Exit the chain and get the underlying value, an object.
      .value()
  );
};

const DetectedToken = ({ setShowDetectedTokens }) => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);
  const networkClientId = useSelector(getSelectedNetworkClientId);
  const detectedTokensMultichain = useSelector(
    getAllDetectedTokensForSelectedAddress,
  );
  const currentChainId = useSelector(getCurrentChainId);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const { tokenNetworkFilter } = useSelector(getPreferences);
  const allOpts = {};
  Object.keys(allNetworks || {}).forEach((chainId) => {
    allOpts[chainId] = true;
  });

  const allNetworksFilterShown =
    Object.keys(tokenNetworkFilter || {}).length !==
    Object.keys(allOpts || {}).length;

  const totalDetectedTokens = useMemo(() => {
    return process.env.PORTFOLIO_VIEW && !allNetworksFilterShown
      ? Object.values(detectedTokensMultichain).flat().length
      : detectedTokens.length;
  }, [detectedTokens, detectedTokensMultichain, allNetworksFilterShown]);

  const [tokensListDetected, setTokensListDetected] = useState({});

  useEffect(() => {
    const newTokensList = () => {
      if (process.env.PORTFOLIO_VIEW && !allNetworksFilterShown) {
        return Object.entries(detectedTokensMultichain).reduce(
          (acc, [chainId, tokens]) => {
            if (Array.isArray(tokens)) {
              tokens.forEach((token) => {
                acc[token.address] = {
                  token: { ...token, chainId },
                  selected: tokensListDetected[token.address]?.selected ?? true,
                };
              });
            }
            return acc;
          },
          {},
        );
      }

      return detectedTokens.reduce((tokenObj, token) => {
        tokenObj[token.address] = {
          token,
          selected: tokensListDetected[token.address]?.selected ?? true,
          chainId: currentChainId,
        };
        return tokenObj;
      }, {});
    };

    setTokensListDetected(newTokensList());
  }, [
    allNetworksFilterShown,
    detectedTokensMultichain,
    detectedTokens,
    currentChainId,
  ]);

  const [showDetectedTokenIgnoredPopover, setShowDetectedTokenIgnoredPopover] =
    useState(false);
  const [partiallyIgnoreDetectedTokens, setPartiallyIgnoreDetectedTokens] =
    useState(false);

  const importSelectedTokens = async (selectedTokens) => {
    selectedTokens.forEach((importedToken) => {
      trackEvent({
        event: MetaMetricsEventName.TokenAdded,
        category: MetaMetricsEventCategory.Wallet,
        sensitiveProperties: {
          token_symbol: importedToken.symbol,
          token_contract_address: importedToken.address,
          token_decimal_precision: importedToken.decimals,
          source: MetaMetricsTokenEventSource.Detected,
          token_standard: TokenStandard.ERC20,
          asset_type: AssetType.token,
          token_added_type: 'detected',
          chain_id: importedToken.chainId,
        },
      });
    });

    if (process.env.PORTFOLIO_VIEW && !allNetworksFilterShown) {
      const tokensByChainId = selectedTokens.reduce((acc, token) => {
        const { chainId } = token;

        if (!acc[chainId]) {
          acc[chainId] = { tokens: [] };
        }

        acc[chainId].tokens.push(token);

        return acc;
      }, {});

      const importPromises = Object.entries(tokensByChainId).map(
        async ([networkId, { tokens }]) => {
          const chainConfig = allNetworks[networkId];
          const { defaultRpcEndpointIndex } = chainConfig;
          const { networkClientId: networkInstanceId } =
            chainConfig.rpcEndpoints[defaultRpcEndpointIndex];

          await dispatch(addImportedTokens(tokens, networkInstanceId));
          const tokenSymbols = tokens.map(({ symbol }) => symbol);
          dispatch(setNewTokensImported(tokenSymbols.join(', ')));
        },
      );

      await Promise.all(importPromises);
    } else {
      await dispatch(addImportedTokens(selectedTokens, networkClientId));
      const tokenSymbols = selectedTokens.map(({ symbol }) => symbol);
      dispatch(setNewTokensImported(tokenSymbols.join(', ')));
    }
  };

  const handleClearTokensSelection = async () => {
    const { selected: selectedTokens = [], deselected: deSelectedTokens = [] } =
      sortingBasedOnTokenSelection(tokensListDetected);

    if (deSelectedTokens.length < totalDetectedTokens) {
      await importSelectedTokens(selectedTokens);
    }

    const tokensDetailsList = deSelectedTokens.map(
      ({ symbol, address }) => `${symbol} - ${address}`,
    );
    trackEvent({
      event: MetaMetricsEventName.TokenHidden,
      category: MetaMetricsEventCategory.Wallet,
      sensitiveProperties: {
        tokens: tokensDetailsList,
        location: MetaMetricsEventLocation.TokenDetection,
        token_standard: TokenStandard.ERC20,
        asset_type: AssetType.token,
      },
    });

    if (process.env.PORTFOLIO_VIEW && !allNetworksFilterShown) {
      // group deselected tokens by chainId
      const groupedByChainId = deSelectedTokens.reduce((acc, token) => {
        const { chainId } = token;
        if (!acc[chainId]) {
          acc[chainId] = [];
        }
        acc[chainId].push(token);
        return acc;
      }, {});

      const promises = Object.entries(groupedByChainId).map(
        async ([chainId, tokens]) => {
          const chainConfig = allNetworks[chainId];
          const { defaultRpcEndpointIndex } = chainConfig;
          const { networkClientId: networkInstanceId } =
            chainConfig.rpcEndpoints[defaultRpcEndpointIndex];

          await dispatch(
            ignoreTokens({
              tokensToIgnore: tokens,
              dontShowLoadingIndicator: true,
              networkClientId: networkInstanceId,
            }),
          );
        },
      );

      await Promise.all(promises);
      setShowDetectedTokens(false);
      setPartiallyIgnoreDetectedTokens(false);
    } else {
      const deSelectedTokensAddresses = deSelectedTokens.map(
        ({ address }) => address,
      );

      await dispatch(
        ignoreTokens({
          tokensToIgnore: deSelectedTokensAddresses,
          dontShowLoadingIndicator: true,
        }),
      );

      setShowDetectedTokens(false);
      setPartiallyIgnoreDetectedTokens(false);
    }
  };

  const handleTokenSelection = (token) => {
    setTokensListDetected((prevState) => ({
      ...prevState,
      [token.address]: {
        ...prevState[token.address],
        selected: !prevState[token.address].selected,
      },
    }));
  };

  const onImport = async () => {
    const { selected: selectedTokens = [] } =
      sortingBasedOnTokenSelection(tokensListDetected);

    if (selectedTokens.length < totalDetectedTokens) {
      setShowDetectedTokenIgnoredPopover(true);
      setPartiallyIgnoreDetectedTokens(true);
    } else {
      await importSelectedTokens(selectedTokens);
      setShowDetectedTokens(false);
    }
  };

  const onIgnoreAll = () => {
    const newTokensListDetected = { ...tokensListDetected };
    for (const tokenAddress of Object.keys(tokensListDetected)) {
      newTokensListDetected[tokenAddress].selected = false;
    }

    setTokensListDetected(newTokensListDetected);
    setShowDetectedTokenIgnoredPopover(true);
  };

  const onCancelIgnore = () => {
    setShowDetectedTokenIgnoredPopover(false);
    setPartiallyIgnoreDetectedTokens(false);
  };

  return (
    <>
      {showDetectedTokenIgnoredPopover && (
        <DetectedTokenIgnoredPopover
          isOpen
          onCancelIgnore={onCancelIgnore}
          handleClearTokensSelection={handleClearTokensSelection}
          partiallyIgnoreDetectedTokens={partiallyIgnoreDetectedTokens}
        />
      )}
      {totalDetectedTokens > 0 && (
        <DetectedTokenSelectionPopover
          detectedTokens={
            process.env.PORTFOLIO_VIEW
              ? detectedTokensMultichain
              : detectedTokens
          }
          tokensListDetected={tokensListDetected}
          handleTokenSelection={handleTokenSelection}
          onImport={onImport}
          onIgnoreAll={onIgnoreAll}
          setShowDetectedTokens={setShowDetectedTokens}
          sortingBasedOnTokenSelection={sortingBasedOnTokenSelection}
        />
      )}
    </>
  );
};

DetectedToken.propTypes = {
  setShowDetectedTokens: PropTypes.func.isRequired,
};

export default DetectedToken;
