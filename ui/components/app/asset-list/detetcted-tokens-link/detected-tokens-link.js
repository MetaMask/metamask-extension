import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import Box from '../../../ui/box/box';
import Button from '../../../ui/button';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getDetectedTokensInCurrentNetwork } from '../../../../selectors';

const DetectedTokensLink = ({ onClick }) => {
  const t = useI18nContext();
  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);
  return (
    <Box className="detected-tokens-link">
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
  onClick: PropTypes.func.isRequired,
};
export default DetectedTokensLink;
