import React from 'react';
import PropTypes from 'prop-types';
import { Icon, ICON_NAMES, Text, ButtonBase } from '../../component-library';
import {
  BackgroundColor,
  BorderRadius,
  IconColor,
  TextVariant,
  TextColor,
  Size,
} from '../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { shortenAddress } from '../../../helpers/utils/util';
import Tooltip from '../../ui/tooltip/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const AddressCopyButton = ({ address, shorten = false }) => {
  const displayAddress = shorten ? shortenAddress(address) : address;
  const [copied, handleCopy] = useCopyToClipboard();
  const t = useI18nContext();

  return (
    <Tooltip position="bottom" title={copied ? t('copiedExclamation') : null}>
      <ButtonBase
        backgroundColor={BackgroundColor.primaryMuted}
        onClick={handleCopy}
        padding={0}
        paddingRight={3}
        paddingLeft={3}
        size={Size.SM}
        style={{ borderRadius: '999px' }}
      >
        <Text
          variant={TextVariant.bodyXs}
          color={TextColor.primaryDefault}
          data-testid="address-copy-button-text"
        >
          {displayAddress}
        </Text>
        <Icon
          color={IconColor.primaryDefault}
          name={copied ? ICON_NAMES.COPY_SUCCESS : ICON_NAMES.COPY}
          size={Size.SM}
        />
      </ButtonBase>
    </Tooltip>
  );
};

AddressCopyButton.propTypes = {
  address: PropTypes.string.isRequired,
  shorten: PropTypes.bool,
};
