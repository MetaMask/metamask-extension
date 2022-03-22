import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../contexts/i18n';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';

import Box from '../../../ui/box';
import Button from '../../../ui/button';
import Typography from '../../../ui/typography';
import CopyIcon from '../../../ui/icon/copy-icon.component';
import Tooltip from '../../../ui/tooltip';

import { COLORS, DISPLAY } from '../../../../helpers/constants/design-system';

import { shortenAddress } from '../../../../helpers/utils/util';

const TokenAddress = ({ address }) => {
  const t = useContext(I18nContext);
  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <Box display={DISPLAY.INLINE_FLEX} className="token-address">
      <Typography color={COLORS.TEXT_DEFAULT}>
        {`${t('tokenAddress')}:`}
      </Typography>
      <Typography color={COLORS.PRIMARY_DEFAULT} margin={[1, 2]}>
        {shortenAddress(address)}
      </Typography>
      <Tooltip
        position="bottom"
        title={copied ? t('copiedExclamation') : t('copyToClipboard')}
      >
        <Button
          type="link"
          className="token-address__copy-link"
          onClick={() => {
            handleCopy(address);
          }}
        >
          <CopyIcon size={11} color="#037DD6" />
        </Button>
      </Tooltip>
    </Box>
  );
};

TokenAddress.propTypes = {
  address: PropTypes.string,
};

export default TokenAddress;
