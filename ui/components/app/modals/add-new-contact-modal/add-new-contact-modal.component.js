import { isValidAddress } from 'ethereumjs-util';
import { providers } from 'ethers';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';
import { isBurnAddress } from '../../../../../shared/modules/hexstring-utils';
import { isValidDomainName } from '../../../../helpers/utils/util';
import Identicon from '../../../ui/identicon';
import TextField from '../../../ui/text-field';
import Button from '../../../ui/button';
import Popover from '../../../ui/popover';

const environmentType = getEnvironmentType();
const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

const AddNewContactModalFooter = (props) => {
  const { saveText, cancelText, toggleModal } = props;
  return (
    <>
      <Button
        type="secondary"
        className="page-container__footer-button"
        onClick={(e) => {
          e.preventDefault();
          toggleModal();
        }}
        rounded
      >
        {cancelText}
      </Button>
      <Button
        type="confirm"
        className="page-container__footer-button"
        onClick={(e) => {
          e.preventDefault();
          toggleModal();
          // Check Form
          // Submit via
          // await addToAddressBook(
          //   this.state.ethAddress,
          //   this.state.newName,
          //   this.state.memo,
          // );
        }}
        rounded
      >
        {saveText}
      </Button>
      {/* <PageContainerFooter
        cancelText={this.context.t('cancel')}
        disabled={Boolean(errorToRender)}
        onSubmit={async () => {
          await addToAddressBook(
            this.state.ethAddress,
            this.state.newName,
            this.state.memo,
          );
          this.props.setIsAddNewContactModalOpen(false);
        }}
        onCancel={() => {
          this.props.setIsAddNewContactModalOpen(false);
        }}
        submitText={this.context.t('save')}
        submitButtonType="confirm"
      /> */}
    </>
  );
};

AddNewContactModalFooter.propTypes = {
  saveText: PropTypes.string,
  cancelText: PropTypes.string,
  toggleModal: PropTypes.func,
};
export default class AddNewContactModal extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    setIsAddNewContactModalOpen: PropTypes.func.isRequired,
    // addToAddressBook: PropTypes.func,
  };

  state = {
    newName: '',
    ethAddress: '',
    ethAddressError: '',
    memo: '',
  };

  constructor(props) {
    super(props);
    this.dValidate = debounce(this.validate, 1000);
  }

  validate = async (e) => {
    const { t } = this.context;
    const ethAddress = e.target.value.trim();
    const validEthAddress = isValidAddress(ethAddress);
    const validEnsAddress =
      isValidDomainName(ethAddress) && /\.eth$/u.test(ethAddress);

    if (validEthAddress) {
      if (isBurnAddress(ethAddress)) {
        this.setState({ ethAddressError: t('burnAddress'), ethAddress });
      } else {
        this.setState({
          ethAddress,
          ethAddressError: '',
        });
      }
    } else if (validEnsAddress) {
      const provider = new providers.Web3Provider(global.ethereumProvider);
      try {
        const ensHexAddress = await provider.resolveName(ethAddress);
        const newName = this.state.newName || ethAddress;
        this.setState({
          ethAddressError: '',
          ethAddress: ensHexAddress,
          newName,
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      this.setState({ ethAddressError: t('invalidAddress'), ethAddress });
    }
  };

  renderEthAddressInput() {
    const { t } = this.context;
    return (
      <TextField
        type="text"
        value={this.state.ethAddress}
        onChange={this.validate}
        placeholder={isFullScreen ? t('addAnEthereumAddress') : ''}
        fullWidth
        margin="dense"
      />
    );
  }

  render() {
    const { t } = this.context;
    // const { addToAddressBook } = this.props;

    const errorToRender = this.state.ethAddressError;

    return (
      <Popover
        title={t('addContact')}
        onClose={() => this.props.setIsAddNewContactModalOpen}
        footer={
          <AddNewContactModalFooter
            saveText={t('save')}
            cancelText={t('cancel')}
            toggleModal={this.props.setIsAddNewContactModalOpen}
          />
        }
      >
        <div className="settings-page__content-row address-book__add-contact">
          {this.state.ensAddress && (
            <div className="address-book__view-contact__group">
              <Identicon address={this.state.ensAddress} diameter={60} />
              <div className="address-book__view-contact__group__value">
                {this.state.ensAddress}
              </div>
            </div>
          )}
          <div className="address-book__add-contact__content">
            <h2 className="address-book__header__name">{t('newContact')}</h2>
            <div className="address-book__view-contact__group">
              <div className="address-book__view-contact__group__label">
                {t('userName')}
              </div>
              <TextField
                type="text"
                id="nickname"
                value={this.state.newName}
                onChange={(e) => this.setState({ newName: e.target.value })}
                placeholder={isFullScreen ? t('userName') : ''}
                fullWidth
                autoFocus
                margin="dense"
              />
            </div>

            <div className="address-book__view-contact__group">
              <div className="address-book__view-contact__group__label">
                {t('ethereumPublicAddress')}
              </div>
              {this.renderEthAddressInput()}
              {errorToRender && (
                <div className="address-book__add-contact__error">
                  {errorToRender}
                </div>
              )}
            </div>

            <div className="add-to-address-book-modal__content">
              <div className="address-book__view-contact__group__label--capitalized">
                {t('memo')}
              </div>
              <textarea
                className="add-new-contact-modal__textarea MuiInputBase-input::placeholder"
                value={this.state.memo}
                onChange={(e) => this.setState({ memo: e.target.value })}
                placeholder={isFullScreen ? t('addMemo') : ''}
              />
            </div>
          </div>
        </div>
      </Popover>
    );
  }
}
