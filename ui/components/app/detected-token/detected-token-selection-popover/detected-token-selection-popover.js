import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../../shared/constants/metametrics';
import {
  getAllDetectedTokensForSelectedAddress,
  getCurrentNetwork,
  getDetectedTokensInCurrentNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
} from '../../../../selectors';

import Popover from '../../../ui/popover';
import Box from '../../../ui/box';
import { Button, ButtonVariant } from '../../../component-library';
import DetectedTokenDetails from '../detected-token-details/detected-token-details';
import { trace, endTrace, TraceName } from '../../../../../shared/lib/trace';

const DetectedTokenSelectionPopover = ({
  tokensListDetected,
  handleTokenSelection,
  onImport,
  onIgnoreAll,
  setShowDetectedTokens,
  sortingBasedOnTokenSelection,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );

  const currentNetwork = useSelector(getCurrentNetwork);

  const detectedTokensMultichain = useSelector(
    getAllDetectedTokensForSelectedAddress,
  );

  const totalTokens = useMemo(() => {
    return isTokenNetworkFilterEqualCurrentNetwork
      ? detectedTokens.length
      : Object.values(detectedTokensMultichain).reduce(
          (count, tokenArray) => count + tokenArray.length,
          0,
        );
  }, [
    detectedTokensMultichain,
    detectedTokens,
    isTokenNetworkFilterEqualCurrentNetwork,
  ]);

  const { selected: selectedTokens = [] } =
    sortingBasedOnTokenSelection(tokensListDetected);

  const onClose = () => {
    const chainIds = Object.keys(detectedTokensMultichain);

    setShowDetectedTokens(false);
    const eventTokensDetails = detectedTokens.map(
      ({ address, symbol }) => `${symbol} - ${address}`,
    );
    trackEvent({
      event: MetaMetricsEventName.TokenImportCanceled,
      category: MetaMetricsEventCategory.Wallet,
      properties: {
        source_connection_method: MetaMetricsTokenEventSource.Detected,
        tokens: eventTokensDetails,
        chain_ids: chainIds,
      },
    });
  };

  const footer = (
    <>
      <Button
        className="detected-token-selection-popover__ignore-button"
        variant={ButtonVariant.Secondary}
        onClick={() => onIgnoreAll()}
      >
        {t('ignoreAll')}
      </Button>
      <Button
        className="detected-token-selection-popover__import-button"
        variant={ButtonVariant.Primary}
        onClick={() => {
          endTrace({ name: TraceName.AccountOverviewAssetListTab });
          trace({ name: TraceName.AccountOverviewAssetListTab });
          onImport();
        }}
        disabled={selectedTokens.length === 0}
      >
        {t('importWithCount', [`(${selectedTokens.length})`])}
      </Button>
    </>
  );

  return (
    <Popover
      className="detected-token-selection-popover"
      title={
        totalTokens === 1
          ? t('tokenFoundTitle')
          : t('tokensFoundTitle', [totalTokens])
      }
      onClose={onClose}
      footer={footer}
    >
      {isTokenNetworkFilterEqualCurrentNetwork ? (
        <Box margin={3}>
          {detectedTokens.map((token, index) => {
            return (
              <DetectedTokenDetails
                key={index}
                token={token}
                handleTokenSelection={handleTokenSelection}
                tokensListDetected={tokensListDetected}
                chainId={currentNetwork.chainId}
              />
            );
          })}
        </Box>
      ) : (
        <Box margin={3}>
          {Object.entries(detectedTokensMultichain).map(
            ([networkId, tokens]) => {
              return tokens.map((token, index) => (
                <DetectedTokenDetails
                  key={`${networkId}-${index}`}
                  token={token}
                  chainId={networkId}
                  handleTokenSelection={handleTokenSelection}
                  tokensListDetected={tokensListDetected}
                />
              ));
            },
          )}
        </Box>
      )}
    </Popover>
  );
};

DetectedTokenSelectionPopover.propTypes = {
  tokensListDetected: PropTypes.object,
  handleTokenSelection: PropTypes.func.isRequired,
  onIgnoreAll: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  setShowDetectedTokens: PropTypes.func.isRequired,
  sortingBasedOnTokenSelection: PropTypes.func.isRequired,
};

export default DetectedTokenSelectionPopover;
