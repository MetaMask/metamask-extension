import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Box from '../../../ui/box/box';
import Button from '../../../ui/button';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getDetectedTokensInCurrentNetwork,
} from '../../../../selectors';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../../shared/constants/metametrics';

const DetectedTokensLink = ({ className = '', setShowDetectedTokens }) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);
  const detectedTokensDetails = detectedTokens.map(
    ({ address, symbol }) => `${symbol} - ${address}`,
  );

  const chainId = useSelector(getCurrentChainId);

  const onClick = () => {
    setShowDetectedTokens(true);
    trackEvent({
      event: MetaMetricsEventName.TokenImportClicked,
      category: MetaMetricsEventCategory.Wallet,
      properties: {
        source: MetaMetricsTokenEventSource.Detected,
        chain_id: chainId,
        tokens: detectedTokensDetails,
      },
    });
  };
  return (
    <Box
      className={classNames('detected-tokens-link', className)}
      marginTop={1}
    >
      <Button
        type="link"
        className="detected-tokens-link__link"
        onClick={onClick}
      >
        {detectedTokens.length === 1
          ? t('numberOfNewTokensDetectedSingular')
          : t('numberOfNewTokensDetectedPlural', [detectedTokens.length])}
      </Button>
    </Box>
  );
};

DetectedTokensLink.propTypes = {
  setShowDetectedTokens: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default DetectedTokensLink;
