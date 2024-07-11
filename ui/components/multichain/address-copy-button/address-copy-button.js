import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { useSelector } from 'react-redux';
import { getSelectedInternalAccount } from '../../../selectors';
import {
  getIsCustodianSupportedChain,
  getCustodianIconForAddress,
} from '../../../selectors/institutional/selectors';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
///: END:ONLY_INCLUDE_IF
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
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';

export const AddressCopyButton = ({
  address,
  shorten = false,
  wrap = false,
  onClick,
}) => {
  const checksummedAddress = toChecksumHexAddress(address);
  const displayAddress = shorten
    ? shortenAddress(checksummedAddress)
    : checksummedAddress;
  const [copied, handleCopy] = useCopyToClipboard(MINUTE);
  const t = useI18nContext();

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const custodianIcon = useSelector((state) =>
    getCustodianIconForAddress(state, selectedAddress),
  );
  const isCustodianSupportedChain = useSelector(getIsCustodianSupportedChain);
  const { nickname, type: networkType } = useSelector(getProviderConfig);
  ///: END:ONLY_INCLUDE_IF

  const tooltipText = copied ? t('copiedExclamation') : t('copyToClipboard');
  let tooltipTitle = tooltipText;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  tooltipTitle = isCustodianSupportedChain
    ? tooltipText
    : t('custodyWrongChain', [nickname || networkType]);
  ///: END:ONLY_INCLUDE_IF

  return (
    <Tooltip position="bottom" title={tooltipTitle}>
      <ButtonBase
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        disabled={!isCustodianSupportedChain}
        ///: END:ONLY_INCLUDE_IF
        backgroundColor={BackgroundColor.primaryMuted}
        onClick={() => {
          handleCopy(checksummedAddress);
          onClick?.();
        }}
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
        <Box display={Display.Flex}>
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            custodianIcon && (
              <img
                src={custodianIcon}
                data-testid="custody-logo"
                className="custody-logo"
                alt="custody logo"
              />
            )
            ///: END:ONLY_INCLUDE_IF
          }
          {displayAddress}
        </Box>
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
  /**
   * Fires when the button is clicked
   */
  onClick: PropTypes.func,
};
