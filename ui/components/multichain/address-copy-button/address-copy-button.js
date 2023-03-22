import React from 'react';
import PropTypes from 'prop-types';
import { ICON_NAMES, ButtonBase } from '../../component-library';
import {
  BackgroundColor,
  IconColor,
  TextVariant,
  TextColor,
  Size,
  BorderRadius,
  AlignItems,
  OVERFLOW_WRAP,
} from '../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { shortenAddress } from '../../../helpers/utils/util';
import Tooltip from '../../ui/tooltip/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const AddressCopyButton = ({
  address,
  shorten = false,
  wrap = false,
}) => {
  const displayAddress = shorten ? shortenAddress(address) : address;
  const [copied, handleCopy] = useCopyToClipboard();
  const t = useI18nContext();

  return (
    <Tooltip position="bottom" title={copied ? t('copiedExclamation') : null}>
      <ButtonBase
        backgroundColor={BackgroundColor.primaryMuted}
        onClick={() => handleCopy(address)}
        padding={0}
        paddingRight={3}
        paddingLeft={3}
        size={Size.SM}
        className="multichain-address-copy-button"
        borderRadius={BorderRadius.pill}
        alignItems={AlignItems.center}
        variant={TextVariant.bodyXs}
        overflowWrap={wrap ? OVERFLOW_WRAP.BREAK_WORD : OVERFLOW_WRAP.NORMAL}
        color={TextColor.primaryDefault}
        endIconName={copied ? ICON_NAMES.COPY_SUCCESS : ICON_NAMES.COPY}
        endIconProps={{ size: Size.SM, color: IconColor.primaryDefault }}
        data-testid="address-copy-button-text"
      >
        {displayAddress}
      </ButtonBase>
    </Tooltip>
  );
};

AddressCopyButton.propTypes = {
  /**
   * Address to be copied
   */
  address: PropTypes.string.isRequired,
  /**
   * Represents if the address should be shortened
   */
  shorten: PropTypes.bool,
  /**
   * Represents if the element should wrap to multiple lines
   */
  wrap: PropTypes.bool,
};
