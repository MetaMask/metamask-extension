import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';

import Box from '../../../ui/box';
import Button from '../../../ui/button';
import Typography from '../../../ui/typography';
import Tooltip from '../../../ui/tooltip';

import {
  COLORS,
  DISPLAY,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';

import { shortenAddress } from '../../../../helpers/utils/util';

const DetectedTokenAddress = ({ tokenAddress }) => {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <Box display={DISPLAY.INLINE_FLEX} className="detected-token-address">
      <Typography variant={TYPOGRAPHY.H7} color={COLORS.TEXT_DEFAULT}>
        {`${t('tokenAddress')}:`}
      </Typography>
      <Typography
        variant={TYPOGRAPHY.H7}
        color={COLORS.PRIMARY_DEFAULT}
        margin={[1, 2]}
      >
        {shortenAddress(tokenAddress)}
      </Typography>
      <Tooltip
        position="bottom"
        title={copied ? t('copiedExclamation') : t('copyToClipboard')}
      >
        <Button
          type="link"
          className="detected-token-address__copy-link"
          onClick={() => {
            handleCopy(tokenAddress);
          }}
        >
          <i className="fa fa-copy" />
        </Button>
      </Tooltip>
    </Box>
  );
};

DetectedTokenAddress.propTypes = {
  tokenAddress: PropTypes.string,
};

export default DetectedTokenAddress;
