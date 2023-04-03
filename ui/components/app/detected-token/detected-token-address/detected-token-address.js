import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';

import Box from '../../../ui/box';
import Button from '../../../ui/button';
import Tooltip from '../../../ui/tooltip';

import {
  DISPLAY,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

import { shortenAddress } from '../../../../helpers/utils/util';
import { Text } from '../../../component-library';

const DetectedTokenAddress = ({ tokenAddress }) => {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <Box display={DISPLAY.INLINE_FLEX} className="detected-token-address">
      <Text variant={TextVariant.bodySm} as="h7" color={TextColor.textDefault}>
        {`${t('tokenAddress')}:`}
      </Text>
      <Text
        variant={TextVariant.bodySm}
        as="h7"
        color={TextColor.primaryDefault}
        marginLeft={2}
        marginRight={2}
      >
        {shortenAddress(tokenAddress)}
      </Text>
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
