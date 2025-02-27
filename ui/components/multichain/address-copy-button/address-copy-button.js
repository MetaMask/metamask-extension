import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ButtonBase, IconName, Box } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  Size,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { shortenAddress } from '../../../helpers/utils/util';
import Tooltip from '../../ui/tooltip/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MINUTE } from '../../../../shared/constants/time';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';

function AddressCopyButton({ address, shorten = false, wrap = false }) {
  const checksummedAddress = normalizeSafeAddress(address);
  const displayAddress = shorten
    ? shortenAddress(checksummedAddress)
    : checksummedAddress;
  const [copied, handleCopy] = useCopyToClipboard(MINUTE);
  const t = useI18nContext();

  const tooltipText = copied ? t('copiedExclamation') : t('copyToClipboard');
  const tooltipTitle = tooltipText;

  const onClickCallback = useCallback(() => {
    handleCopy(checksummedAddress);
  }, [handleCopy, checksummedAddress]);

  return (
    <Tooltip position="bottom" title={tooltipTitle}>
      <ButtonBase
        backgroundColor={BackgroundColor.primaryMuted}
        onClick={onClickCallback}
        paddingRight={4}
        paddingLeft={4}
        size={Size.SM}
        variant={TextVariant.bodySm}
        color={TextColor.primaryDefault}
        endIconName={copied ? IconName.CopySuccess : IconName.Copy}
        className={classnames('multichain-address-copy-button', {
          'multichain-address-copy-button__address--wrap': wrap,
        })}
        borderRadius={BorderRadius.pill}
        alignItems={AlignItems.center}
        data-testid="address-copy-button-text"
      >
        <Box display={Display.Flex}>{displayAddress}</Box>
      </ButtonBase>
    </Tooltip>
  );
}

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

export default React.memo(AddressCopyButton);
