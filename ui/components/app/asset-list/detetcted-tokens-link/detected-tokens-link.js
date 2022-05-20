import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Box from '../../../ui/box/box';
import Button from '../../../ui/button';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getDetectedTokensInCurrentNetwork } from '../../../../selectors';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  EVENT,
  EVENT_NAMES,
} from '../../../../../shared/constants/metametrics';

const DetectedTokensLink = ({ className = '', setShowDetectedTokens }) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);
  const detectedTokensDetails = detectedTokens.map(
    ({ address, symbol }) => `${symbol} - ${address}`,
  );

  const onClick = () => {
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
    <Box
      className={classNames('detected-tokens-link', className)}
      marginTop={1}
    >
      <Button
        type="link"
        className="detected-tokens-link__link"
        onClick={onClick}
      >
        {t('numberOfNewTokensDetected', [detectedTokens.length])}
      </Button>
    </Box>
  );
};

DetectedTokensLink.propTypes = {
  setShowDetectedTokens: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default DetectedTokensLink;
