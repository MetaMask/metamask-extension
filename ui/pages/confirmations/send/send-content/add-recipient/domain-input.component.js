import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { isHexString } from '@metamask/utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { addHexPrefix } from '../../../../../../app/scripts/lib/util';
import { shortenAddress } from '../../../../../helpers/utils/util';
import {
  isBurnAddress,
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../../../../shared/modules/hexstring-utils';
import {
  ButtonIcon,
  IconName,
  IconSize,
  AvatarAccount,
  AvatarAccountVariant,
  Text,
} from '../../../../../components/component-library';
import {
  IconColor,
  Size,
  BackgroundColor,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';

export default class DomainInput extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    className: PropTypes.string,
    useBlockie: PropTypes.bool,
    selectedAddress: PropTypes.string,
    selectedName: PropTypes.string,
    scanQrCode: PropTypes.func,
    onPaste: PropTypes.func,
    onValidAddressTyped: PropTypes.func,
    internalSearch: PropTypes.bool,
    userInput: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    lookupDomainName: PropTypes.func.isRequired,
    initializeDomainSlice: PropTypes.func.isRequired,
    resetDomainResolution: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.props.initializeDomainSlice();
  }

  onPaste = (event) => {
    if (event.clipboardData.items?.length) {
      const clipboardItem = event.clipboardData.items[0];
      clipboardItem?.getAsString((text) => {
        const input = text.trim();
        if (
          !isBurnAddress(input) &&
          isValidHexAddress(input, { mixedCaseUseChecksum: true })
        ) {
          this.props.onPaste(addHexPrefix(input));
        }
      });
    }
  };

  onChange = ({ target: { value } }) => {
    const {
      onValidAddressTyped,
      internalSearch,
      onChange,
      lookupDomainName,
      resetDomainResolution,
    } = this.props;
    const input = value.trim();

    if (internalSearch) {
      onChange(input);
      return null;
    }

    if (isHexString(input)) {
      resetDomainResolution();
      if (
        onValidAddressTyped &&
        !isBurnAddress(input) &&
        isValidHexAddress(input, { mixedCaseUseChecksum: true })
      ) {
        const hexInput = addHexPrefix(input);
        onChange(hexInput);
        onValidAddressTyped(hexInput);
      } else {
        onChange(input);
      }
    } else {
      onChange(input);
      lookupDomainName(input);
    }

    return null;
  };

  render() {
    const { t } = this.context;
    const { className, selectedAddress, selectedName, userInput, useBlockie } =
      this.props;

    const hasSelectedAddress = Boolean(selectedAddress);

    const shortenedAddress =
      selectedName && selectedAddress
        ? shortenAddress(toChecksumHexAddress(selectedAddress))
        : undefined;

    return (
      <div className={classnames('ens-input', className)}>
        <div
          className={classnames('ens-input__wrapper', {
            'ens-input__wrapper__status-icon--error': false,
            'ens-input__wrapper__status-icon--valid': false,
            'ens-input__wrapper--valid': hasSelectedAddress,
          })}
        >
          {hasSelectedAddress ? (
            <>
              <div
                className="ens-input__wrapper__input ens-input__wrapper__input--selected"
                data-testid="ens-input-selected"
              >
                <AvatarAccount
                  variant={
                    useBlockie
                      ? AvatarAccountVariant.Blockies
                      : AvatarAccountVariant.Jazzicon
                  }
                  address={selectedAddress}
                  size={Size.MD}
                  borderColor={BackgroundColor.backgroundDefault} // we currently don't have white color for border hence using backgroundDefault as the border
                />
                <div className="ens-input__selected-input__title">
                  {selectedName || selectedAddress}
                  {shortenedAddress ? (
                    <Text
                      color={TextColor.textAlternative}
                      variant={TextVariant.bodySm}
                      ellipsis
                    >
                      {shortenedAddress}
                    </Text>
                  ) : null}
                </div>
              </div>
              <ButtonIcon
                iconName={IconName.Close}
                ariaLabel={t('close')}
                onClick={this.props.onReset}
                className="ens-input__wrapper__action-icon-button"
                size={IconSize.Sm}
              />
            </>
          ) : (
            <>
              <input
                className="ens-input__wrapper__input"
                type="text"
                dir="auto"
                placeholder={t('recipientAddressPlaceholderNew')}
                onChange={this.onChange}
                onPaste={this.onPaste}
                spellCheck="false"
                value={selectedAddress || userInput}
                autoFocus
                data-testid="ens-input"
              />
              <ButtonIcon
                className="ens-input__wrapper__action-icon-button"
                onClick={() => {
                  if (userInput?.length > 0) {
                    this.props.onReset();
                  } else {
                    this.props.scanQrCode();
                  }
                }}
                iconName={userInput ? IconName.Close : IconName.Scan}
                ariaLabel={t(userInput ? 'close' : 'scanQrCode')}
                color={
                  userInput ? IconColor.iconDefault : IconColor.primaryDefault
                }
                data-testid="ens-qr-scan-button"
              />
            </>
          )}
        </div>
      </div>
    );
  }
}
