import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Box from '../../../ui/box/box';
import Button from '../../../ui/button';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getDetectedTokensInCurrentNetwork } from '../../../../selectors';

const DetectedTokensLink = ({ className = '', onClick }) => {
  const t = useI18nContext();
  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);

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
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default DetectedTokensLink;
