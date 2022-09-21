import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { addHexPrefix } from '../../../../../app/scripts/lib/util';
import {
  isValidENSDomainName,
  isValidUnstoppableDomainName,
} from '../../../../helpers/utils/util';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../../shared/modules/hexstring-utils';

export default class DomainInput extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  // temporary object to store Unstoppable Tlds
  udRequirements = {
    tlds: [],
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
    onReset: PropTypes.func.isRequired,
    lookupEnsName: PropTypes.func.isRequired,
    prepareResolutionCall: PropTypes.func.isRequired,
    initializeEnsSlice: PropTypes.func.isRequired,
    initializeUnsSlice: PropTypes.func.isRequired,
    resetUnsResolution: PropTypes.func.isRequired,
    resetEnsResolution: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.props.initializeEnsSlice();
    this.props.initializeUnsSlice();
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

  onChange = async ({ target: { value } }) => {
    const {
      onValidAddressTyped,
      internalSearch,
      onChange,
      lookupEnsName,
      resetEnsResolution,
      resetUnsResolution,
      prepareResolutionCall,
    } = this.props;
    const input = value.trim();

    onChange(input);
    if (internalSearch) {
      return null;
    }
    // check if user input is a Valid Unstoppable Domain
    // if valid, calls prepareResolutionCall and resolves the Unstoppable Domain
    if (await isValidUnstoppableDomainName(input)) {
      resetEnsResolution();
      prepareResolutionCall(input);
    } else if (isValidENSDomainName(input)) {
      resetUnsResolution();
      lookupEnsName(input);
    } else {
      resetUnsResolution();
      resetEnsResolution();
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
      <div className={classnames('domain-input', className)}>
        <div
          className={classnames('domain-input__wrapper', {
            'domain-input__wrapper__status-icon--error': false,
            'domain-input__wrapper__status-icon--valid': false,
            'domain-input__wrapper--valid': hasSelectedAddress,
          })}
        >
          <i
            className={classnames('domain-input__wrapper__status-icon', 'fa', {
              'fa-check-circle': hasSelectedAddress,
              'fa-search': !hasSelectedAddress,
            })}
            style={{
              color: hasSelectedAddress
                ? 'var(--color-success-default)'
                : 'var(--color-icon-muted)',
            }}
          />
          {hasSelectedAddress ? (
            <>
              <div className="domain-input__wrapper__input domain-input__wrapper__input--selected">
                <div className="domain-input__selected-input__title">
                  {selectedName || selectedAddress}
                </div>
                {selectedName !== selectedAddress && (
                  <div className="domain-input__selected-input__subtitle">
                    {selectedAddress}
                  </div>
                )}
              </div>
              <button
                onClick={this.props.onReset}
                className="domain-input__wrapper__action-icon-button"
              >
                <i
                  className="fa fa-times"
                  style={{
                    color: 'var(--color-icon-default)',
                  }}
                  title={t('close')}
                />
              </button>
            </>
          ) : (
            <>
              <input
                className="domain-input__wrapper__input"
                type="text"
                dir="auto"
                placeholder={t('recipientAddressPlaceholder')}
                onChange={this.onChange}
                onPaste={this.onPaste}
                spellCheck="false"
                value={selectedAddress || userInput}
                autoFocus
                data-testid="domain-input"
              />
              <button
                className="domain-input__wrapper__action-icon-button"
                onClick={() => {
                  if (userInput) {
                    this.props.onReset();
                  } else {
                    this.props.scanQrCode();
                  }
                }}
              >
                <i
                  className={classnames('fa', {
                    'fa-times': userInput,
                    'fa-qrcode': !userInput,
                  })}
                  title={t(userInput ? 'close' : 'scanQrCode')}
                  style={{
                    color: userInput
                      ? 'var(--color-icon-default)'
                      : 'var(--color-primary-default)',
                  }}
                />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
}
