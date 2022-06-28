import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../contexts/i18n';
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

const DetectedTokenAddress = ({ address }) => {
  const t = useContext(I18nContext);
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
        {shortenAddress(address)}
      </Typography>
      <Tooltip
        position="bottom"
        title={copied ? t('copiedExclamation') : t('copyToClipboard')}
      >
        <Button
          type="link"
          className="detected-token-address__copy-link"
          onClick={() => {
            handleCopy(address);
          }}
        >
          <i className="fa fa-copy" />
        </Button>
      </Tooltip>
    </Box>
  );
};

DetectedTokenAddress.propTypes = {
  address: PropTypes.string,
};

export default DetectedTokenAddress;
