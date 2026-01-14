import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';

import Tooltip from '../../../ui/tooltip';

import {
  Display,
  TextColor,
} from '../../../../helpers/constants/design-system';

import { shortenAddress } from '../../../../helpers/utils/util';
import { Text, Box, ButtonLink, IconName } from '../../../component-library';

const DetectedTokenAddress = ({ tokenAddress }) => {
  const t = useI18nContext();

  // useCopyToClipboard analysis: Copies the public address of the detected token
  const [copied, handleCopy] = useCopyToClipboard(-1);

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
