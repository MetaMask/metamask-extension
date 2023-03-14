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

export const AddressSnippetButton = ({ address, shorten = false }) => {
  const displayAddress = shorten ? shortenAddress(address) : address;
  const [copied, handleCopy] = useCopyToClipboard();
  const t = useI18nContext();

  return (
    <Tooltip position="bottom" title={copied ? t('copiedExclamation') : null}>
      <ButtonBase
        borderRadius={BorderRadius.XL}
        backgroundColor={BackgroundColor.primaryMuted}
        onClick={handleCopy}
        padding={0}
        paddingRight={2}
        paddingLeft={2}
        size={Size.SM}
      >
        <Text variant={TextVariant.bodyXs} color={TextColor.primaryDefault}>
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

AddressSnippetButton.propTypes = {
  address: PropTypes.string.isRequired,
  shorten: PropTypes.bool,
};
