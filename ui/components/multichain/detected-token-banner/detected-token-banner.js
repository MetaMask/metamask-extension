import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { getDetectedTokensInCurrentNetwork } from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import { BannerAlert } from '../../component-library';

export const DetectedTokensBanner = ({
  className,
  setShowDetectedTokens,
  ...props
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);
  const detectedTokensDetails = detectedTokens.map(
    ({ address, symbol }) => `${symbol} - ${address}`,
  );

  const handleOnClick = () => {
    setShowDetectedTokens(true);
    trackEvent({
      event: EVENT_NAMES.TOKEN_IMPORT_CLICKED,
      category: EVENT.CATEGORIES.WALLET,
      properties: {
        source: EVENT.SOURCE.TOKEN.DETECTED,
        tokens: detectedTokensDetails,
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
      {detectedTokens.length === 1
        ? t('numberOfNewTokensDetectedSingular')
        : t('numberOfNewTokensDetectedPlural', [detectedTokens.length])}
    </BannerAlert>
  );
};

DetectedTokensBanner.propTypes = {
  setShowDetectedTokens: PropTypes.func.isRequired,
  className: PropTypes.string,
};
