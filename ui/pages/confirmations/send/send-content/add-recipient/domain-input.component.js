import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { isHexString } from '@metamask/utils';
import { addHexPrefix } from '../../../../../../app/scripts/lib/util';
import { IS_FLASK, isValidDomainName } from '../../../../../helpers/utils/util';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../../../shared/modules/hexstring-utils';
import {
  ButtonIcon,
  IconName,
  IconSize,
} from '../../../../../components/component-library';
import { IconColor } from '../../../../../helpers/constants/design-system';

export default class DomainInput extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  static propTypes = {
    className: PropTypes.string,
    selectedAddress: PropTypes.string,
    selectedName: PropTypes.string,
    scanQrCode: PropTypes.func,
    onPaste: PropTypes.func,
    onValidAddressTyped: PropTypes.func,
    internalSearch: PropTypes.bool,
    userInput: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    chainId: PropTypes.string.isRequired,
    onReset: PropTypes.func.isRequired,
    lookupDomainName: PropTypes.func.isRequired,
    initializeDomainSlice: PropTypes.func.isRequired,
    resetDomainResolution: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.props.initializeDomainSlice();
  }

  componentDidUpdate = (prevProps) => {
    const { chainId, userInput } = this.props;
    if (prevProps.chainId !== chainId) {
      this.onChange({ target: { value: userInput } });
    }
  };

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

    onChange(input);
    if (internalSearch) {
      return null;
    }

    if ((IS_FLASK && !isHexString(input)) || isValidDomainName(input)) {
      lookupDomainName(input);
    } else {
      resetDomainResolution();
      if (
        onValidAddressTyped &&
        !isBurnAddress(input) &&
        isValidHexAddress(input, { mixedCaseUseChecksum: true })
      ) {
        onValidAddressTyped(addHexPrefix(input));
      }
    }

    return null;
  };

  render() {
    const { t } = this.context;
    const { className, selectedAddress, selectedName, userInput } = this.props;

    const hasSelectedAddress = Boolean(selectedAddress);

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
              <div className="ens-input__wrapper__input ens-input__wrapper__input--selected">
                <div className="ens-input__selected-input__title">
                  {selectedName || selectedAddress}
                </div>
                {selectedName !== selectedAddress && (
                  <div className="ens-input__selected-input__subtitle">
                    {selectedAddress}
                  </div>
                )}
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
                placeholder={
                  IS_FLASK
                    ? t('recipientAddressPlaceholderFlask')
                    : t('recipientAddressPlaceholder')
                }
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
                  if (userInput) {
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
