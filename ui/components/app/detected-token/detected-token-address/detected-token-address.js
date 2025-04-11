import PropTypes from 'prop-types';
import React from 'react';

import {
  Display,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { shortenAddress } from '../../../../helpers/utils/util';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Text, Box, ButtonLink, IconName } from '../../../component-library';
import Tooltip from '../../../ui/tooltip';

const DetectedTokenAddress = ({ tokenAddress }) => {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <Box display={Display.InlineFlex} className="detected-token-address">
      <Text color={TextColor.textDefault}>{`${t('tokenAddress')}:`}</Text>
      <Tooltip
        position="bottom"
        title={copied ? t('copiedExclamation') : t('copyToClipboard')}
      >
        <ButtonLink
          className="detected-token-address__copy-link"
          onClick={() => {
            handleCopy(tokenAddress);
          }}
          endIconName={IconName.Copy}
          marginLeft={2}
          marginRight={2}
        >
          {shortenAddress(tokenAddress)}
        </ButtonLink>
      </Tooltip>
    </Box>
  );
};

DetectedTokenAddress.propTypes = {
  tokenAddress: PropTypes.string,
};

export default DetectedTokenAddress;
