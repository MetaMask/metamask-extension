import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import Identicon from '../../../../components/ui/identicon';
import TextField from '../../../../components/ui/text-field';
import { CONTACT_LIST_ROUTE } from '../../../../helpers/constants/routes';
import { isValidDomainName } from '../../../../helpers/utils/util';
import DomainInput from '../../../confirmations/send/send-content/add-recipient/domain-input';
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../../shared/modules/hexstring-utils';
import { INVALID_RECIPIENT_ADDRESS_ERROR } from '../../../confirmations/send/send.constants';

export default class AddContact extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    addToAddressBook: PropTypes.func,
    history: PropTypes.object,
    scanQrCode: PropTypes.func,
    qrCodeData:
      PropTypes.object /* eslint-disable-line react/no-unused-prop-types */,
    qrCodeDetected: PropTypes.func,
    domainResolution: PropTypes.string,
    domainError: PropTypes.string,
    resetDomainResolution: PropTypes.func,
  };

  state = {
    newName: '',
    ethAddress: '',
    error: '',
    input: '',
  };

  constructor(props) {
    super(props);
    this.dValidate = debounce(this.validate, 500);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.qrCodeData) {
      if (nextProps.qrCodeData.type === 'address') {
        const { domainResolution } = this.props;
        const scannedAddress =
          nextProps.qrCodeData.values.address.toLowerCase();
        const currentAddress = domainResolution || this.state.ethAddress;
        if (currentAddress.toLowerCase() !== scannedAddress) {
          this.setState({ input: scannedAddress });
          this.validate(scannedAddress);
          // Clean up QR code data after handling
          this.props.qrCodeDetected(null);
        }
      }
    }
  }

  validate = (address) => {
    const valid =
      !isBurnAddress(address) &&
      isValidHexAddress(address, { mixedCaseUseChecksum: true });
    const validEnsAddress = isValidDomainName(address);

    if (valid || validEnsAddress || address === '') {
      this.setState({ error: '', ethAddress: address });
    } else {
      this.setState({ error: INVALID_RECIPIENT_ADDRESS_ERROR });
    }
  };

  onChange = (input) => {
    this.setState({ input });
    this.dValidate(input);
  };

  renderInput() {
    return (
      <DomainInput
        scanQrCode={(_) => {
          this.props.scanQrCode();
        }}
        onChange={this.onChange}
        onPaste={(text) => {
          this.setState({ input: text });
          this.validate(text);
        }}
        onReset={() => {
          this.props.resetDomainResolution();
          this.setState({ ethAddress: '', input: '' });
        }}
        userInput={this.state.input}
      />
    );
  }

  render() {
    const { t } = this.context;
    const { history, addToAddressBook, domainError, domainResolution } =
      this.props;

    const errorToRender = domainError || this.state.error;

    return (
      <div className="settings-page__content-row address-book__add-contact">
        {domainResolution && (
          <div className="address-book__view-contact__group">
            <Identicon address={domainResolution} diameter={60} />
            <div className="address-book__view-contact__group__value">
              {domainResolution}
            </div>
          </div>
        )}
        <div className="address-book__add-contact__content">
          <div className="address-book__view-contact__group address-book__add-contact__content__username">
            <div className="address-book__view-contact__group__label">
              {t('userName')}
            </div>
            <TextField
              type="text"
              id="nickname"
              value={this.state.newName}
              onChange={(e) => this.setState({ newName: e.target.value })}
              fullWidth
              margin="dense"
            />
          </div>

          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              {t('ethereumPublicAddress')}
            </div>
            {this.renderInput()}
            {errorToRender && (
              <div className="address-book__add-contact__error">
                {t(errorToRender)}
              </div>
            )}
          </div>
        </div>
        <PageContainerFooter
          cancelText={this.context.t('cancel')}
          disabled={Boolean(
            this.state.error ||
              !this.state.ethAddress ||
              !this.state.newName.trim(),
          )}
          onSubmit={async () => {
            await addToAddressBook(
              domainResolution || this.state.ethAddress,
              this.state.newName,
            );
            history.push(CONTACT_LIST_ROUTE);
          }}
          onCancel={() => {
            history.push(CONTACT_LIST_ROUTE);
          }}
          submitText={this.context.t('save')}
        />
      </div>
    );
  }
}
