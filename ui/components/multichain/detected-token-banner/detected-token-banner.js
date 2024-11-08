import React, { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getDetectedTokensInCurrentNetwork,
  getPreferences,
  getSelectedInternalAccount,
  getAllDetectedTokens,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../shared/constants/metametrics';
import { BannerAlert } from '../../component-library';

export const DetectedTokensBanner = ({
  className,
  actionButtonOnClick,
  ...props
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const { tokenNetworkFilter } = useSelector(getPreferences);

  const allNetworksFilterShown = Object.keys(tokenNetworkFilter ?? {}).length;

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const allDetectedTokens = useSelector(getAllDetectedTokens);

  const { detectedTokensMultichain } = useMemo(() => {
    const detectedTokensAllChains = Object.entries(
      allDetectedTokens || {},
    ).reduce((acc, [chainId, chainTokens]) => {
      const tokensForAddress = chainTokens[selectedAddress];
      if (tokensForAddress) {
        acc[chainId] = tokensForAddress.map((token) => ({
          ...token,
          chainId,
        }));
      }
      return acc;
    }, {});

    return { detectedTokensMultichain: detectedTokensAllChains };
  }, [selectedAddress, allDetectedTokens]);

  const chainId = useSelector(getCurrentChainId);

  const detectedTokensDetails =
    process.env.PORTFOLIO_VIEW && !allNetworksFilterShown
      ? Object.values(detectedTokensMultichain)
          .flat()
          .map(({ address, symbol }) => `${symbol} - ${address}`)
      : detectedTokens.map(({ address, symbol }) => `${symbol} - ${address}`);

  const totalTokens =
    process.env.PORTFOLIO_VIEW && !allNetworksFilterShown
      ? Object.values(detectedTokensMultichain).reduce(
          (count, tokenArray) => count + tokenArray.length,
          0,
        )
      : detectedTokens.length;

  const handleOnClick = () => {
    actionButtonOnClick();
    trackEvent({
      event: MetaMetricsEventName.TokenImportClicked,
      category: MetaMetricsEventCategory.Wallet,
      properties: {
        source_connection_method: MetaMetricsTokenEventSource.Detected,
        tokens: detectedTokensDetails,
        chain_id: chainId,
      },
    });
  };
  return (
    <BannerAlert
      className={classNames('multichain-detected-token-banner', className)}
      actionButtonLabel={t('importTokensCamelCase')}
      actionButtonOnClick={handleOnClick}
      data-testid="detected-token-banner"
      {...props}
    >
      {totalTokens === 1
        ? t('numberOfNewTokensDetectedSingular')
        : t('numberOfNewTokensDetectedPlural', [totalTokens])}
    </BannerAlert>
  );
};

DetectedTokensBanner.propTypes = {
  /**
   * Handler to be passed to the DetectedTokenBanner component
   */
  actionButtonOnClick: PropTypes.func.isRequired,
  /**
   * An additional className to the DetectedTokenBanner component
   */
  className: PropTypes.string,
};
