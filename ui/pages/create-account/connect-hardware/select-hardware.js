import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Button from '../../../components/ui/button';
import LogoLedger from '../../../components/ui/logo/logo-ledger';
import LogoQRBased from '../../../components/ui/logo/logo-qr-based';
import LogoTrezor from '../../../components/ui/logo/logo-trezor';
import LogoLattice from '../../../components/ui/logo/logo-lattice';

import {
  DEVICE_NAMES,
  LEDGER_TRANSPORT_TYPES,
} from '../../../../shared/constants/hardware-wallets';

export default class SelectHardware extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    connectToHardwareWallet: PropTypes.func.isRequired,
    browserSupported: PropTypes.bool.isRequired,
    ledgerTransportType: PropTypes.oneOf(Object.values(LEDGER_TRANSPORT_TYPES)),
  };

  state = {
    selectedDevice: null,
  };

  connect = () => {
    if (this.state.selectedDevice) {
      this.props.connectToHardwareWallet(this.state.selectedDevice);
    }
    return null;
  };

  renderConnectToTrezorButton() {
    return (
      <button
        className={classnames('hw-connect__btn', {
          selected: this.state.selectedDevice === DEVICE_NAMES.TREZOR,
        })}
        onClick={(_) => this.setState({ selectedDevice: DEVICE_NAMES.TREZOR })}
      >
        <LogoTrezor className="hw-connect__btn__img" ariaLabel="Trezor" />
      </button>
    );
  }

  renderConnectToLatticeButton() {
    return (
      <button
        className={classnames('hw-connect__btn', {
          selected: this.state.selectedDevice === DEVICE_NAMES.LATTICE,
        })}
        onClick={(_) => this.setState({ selectedDevice: DEVICE_NAMES.LATTICE })}
      >
        <LogoLattice className="hw-connect__btn__img" ariaLabel="Lattice" />
      </button>
    );
  }

  renderConnectToLedgerButton() {
    return (
      <button
        className={classnames('hw-connect__btn', {
          selected: this.state.selectedDevice === DEVICE_NAMES.LEDGER,
        })}
        onClick={(_) => this.setState({ selectedDevice: DEVICE_NAMES.LEDGER })}
      >
        <LogoLedger className="hw-connect__btn__img" ariaLabel="Ledger" />
      </button>
    );
  }

  renderConnectToQRButton() {
    return (
      <button
        className={classnames('hw-connect__btn', {
          selected: this.state.selectedDevice === DEVICE_NAMES.QR,
        })}
        onClick={(_) => this.setState({ selectedDevice: DEVICE_NAMES.QR })}
      >
        <LogoQRBased className="hw-connect__btn__img" ariaLabel="QRCode" />
      </button>
    );
  }

  renderButtons() {
    return (
      <>
        <div className="hw-connect__btn-wrapper">
          {this.renderConnectToLedgerButton()}
          {this.renderConnectToTrezorButton()}
        </div>
        <div
          className="hw-connect__btn-wrapper"
          style={{ margin: '10px 0 0 0' }}
        >
          {this.renderConnectToLatticeButton()}
          {this.renderConnectToQRButton()}
        </div>
      </>
    );
  }

  renderContinueButton() {
    return (
      <Button
        type="primary"
        large
        className="hw-connect__connect-btn"
        onClick={this.connect}
        disabled={!this.state.selectedDevice}
      >
        {this.context.t('continue')}
      </Button>
    );
  }

  renderUnsupportedBrowser() {
    return (
      <div className="new-external-account-form unsupported-browser">
        <div className="hw-connect">
          <h3 className="hw-connect__title">
            {this.context.t('browserNotSupported')}
          </h3>
          <p className="hw-connect__msg">
            {this.context.t('chromeRequiredForHardwareWallets')}
          </p>
        </div>
        <Button
          type="primary"
          large
          onClick={() =>
            global.platform.openTab({
              url: 'https://google.com/chrome',
            })
          }
        >
          {this.context.t('downloadGoogleChrome')}
        </Button>
      </div>
    );
  }

  renderHeader() {
    return (
      <div className="hw-connect__header">
        <h3 className="hw-connect__header__title">
          {this.context.t('hardwareWallets')}
        </h3>
        <p className="hw-connect__header__msg">
          {this.context.t('hardwareWalletsMsg')}
        </p>
      </div>
    );
  }

  renderTutorialsteps() {
    switch (this.state.selectedDevice) {
      case DEVICE_NAMES.LEDGER:
        return this.renderLedgerTutorialSteps();
      case DEVICE_NAMES.TREZOR:
        return this.renderTrezorTutorialSteps();
      case DEVICE_NAMES.LATTICE:
        return this.renderLatticeTutorialSteps();
      case DEVICE_NAMES.QR:
        return this.renderQRHardwareWalletSteps();
      default:
        return '';
    }
  }

  renderLedgerTutorialSteps() {
    const steps = [];
    if (this.props.ledgerTransportType === LEDGER_TRANSPORT_TYPES.LIVE) {
      steps.push({
        title: this.context.t('step1LedgerWallet'),
        message: this.context.t('step1LedgerWalletMsg', [
          <a
            className="hw-connect__msg-link"
            href="https://www.ledger.com/ledger-live"
            rel="noopener noreferrer"
            target="_blank"
            key="ledger-live-app-link"
          >
            {this.context.t('ledgerLiveApp')}
          </a>,
        ]),
      });
    }

    steps.push({
      asset: 'plug-in-wallet',
      dimensions: { width: '225px', height: '75px' },
      title: this.context.t('step2LedgerWallet'),
      message: this.context.t('step2LedgerWalletMsg', [
        <a
          className="hw-connect__msg-link"
          href="https://metamask.zendesk.com/hc/en-us/articles/360020394612-How-to-connect-a-Trezor-or-Ledger-Hardware-Wallet"
          rel="noopener noreferrer"
          target="_blank"
          key="ledger-support-link"
        >
          {this.context.t('hardwareWalletSupportLinkConversion')}
        </a>,
      ]),
    });

    return (
      <div className="hw-tutorial">
        {steps.map((step, index) => (
          <div className="hw-connect" key={index}>
            <h3 className="hw-connect__title">{step.title}</h3>
            <p className="hw-connect__msg">{step.message}</p>
            {step.asset && (
              <img
                className="hw-connect__step-asset"
                src={`images/${step.asset}.svg`}
                {...step.dimensions}
                alt=""
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  renderLatticeTutorialSteps() {
    const steps = [
      {
        asset: 'connect-lattice',
        dimensions: { width: '225px', height: '75px' },
        title: this.context.t('step1LatticeWallet'),
        message: this.context.t('step1LatticeWalletMsg', [
          <a
            className="hw-connect__msg-link"
            href="https://metamask.zendesk.com/hc/en-us/articles/4408552261275"
            rel="noopener noreferrer"
            target="_blank"
            key="lattice-setup-link"
          >
            {this.context.t('hardwareWalletSupportLinkConversion')}
          </a>,
        ]),
      },
    ];

    return (
      <div className="hw-tutorial">
        {steps.map((step, index) => (
          <div className="hw-connect" key={index}>
            <h3 className="hw-connect__title">{step.title}</h3>
            <p className="hw-connect__msg">{step.message}</p>
            {step.asset && (
              <img
                className="hw-connect__step-asset"
                src={`images/${step.asset}.svg`}
                {...step.dimensions}
                alt=""
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  renderTrezorTutorialSteps() {
    const steps = [
      {
        asset: 'plug-in-wallet',
        dimensions: { width: '225px', height: '75px' },
        title: this.context.t('step1TrezorWallet'),
        message: this.context.t('step1TrezorWalletMsg', [
          <a
            className="hw-connect__msg-link"
            href="https://metamask.zendesk.com/hc/en-us/articles/360020394612-How-to-connect-a-Trezor-or-Ledger-Hardware-Wallet"
            rel="noopener noreferrer"
            target="_blank"
            key="trezor-support-link"
          >
            {this.context.t('hardwareWalletSupportLinkConversion')}
          </a>,
        ]),
      },
    ];

    return (
      <div className="hw-tutorial">
        {steps.map((step, index) => (
          <div className="hw-connect" key={index}>
            <h3 className="hw-connect__title">{step.title}</h3>
            <p className="hw-connect__msg">{step.message}</p>
            {step.asset && (
              <img
                className="hw-connect__step-asset"
                src={`images/${step.asset}.svg`}
                {...step.dimensions}
                alt=""
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  renderQRHardwareWalletSteps() {
    const steps = [];
    steps.push(
      {
        title: this.context.t('QRHardwareWalletSteps1Title'),
        message: this.context.t('QRHardwareWalletSteps1Description'),
      },
      {
        message: (
          <>
            <a
              className="hw-connect__msg-link"
              href="https://keyst.one"
              rel="noopener noreferrer"
              target="_blank"
              key="keystone-support-link"
            >
              {this.context.t('keystone')}
            </a>
            <a
              className="hw-connect__msg-link"
              href="https://keyst.one/mm"
              rel="noopener noreferrer"
              target="_blank"
              key="keystone-tutorial-link"
            >
              {this.context.t('keystoneTutorial')}
            </a>
          </>
        ),
      },
      {
        message: (
          <>
            <a
              className="hw-connect__msg-link"
              href="https://airgap.it/metamask"
              rel="noopener noreferrer"
              target="_blank"
              key="airgap-vault-support-link"
            >
              {this.context.t('airgapVault')}
            </a>
            <a
              className="hw-connect__msg-link"
              href="https://support.airgap.it/guides/metamask"
              rel="noopener noreferrer"
              target="_blank"
              key="airgap-vault-tutorial-link"
            >
              {this.context.t('airgapVaultTutorial')}
            </a>
          </>
        ),
      },
      {
        message: this.context.t('QRHardwareWalletSteps2Description'),
      },
      {
        asset: 'qrcode-wallet-demo',
        dimensions: { width: '225px', height: '75px' },
      },
    );
    return (
      <div className="hw-tutorial">
        {steps.map((step, index) => (
          <div className="hw-connect" key={index}>
            {step.title && <h3 className="hw-connect__title">{step.title}</h3>}
            <p className="hw-connect__msg">{step.message}</p>
            {step.asset && (
              <img
                className="hw-connect__step-asset"
                src={`images/${step.asset}.svg`}
                {...step.dimensions}
                alt=""
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  renderConnectScreen() {
    return (
      <div className="new-external-account-form">
        {this.renderHeader()}
        {this.renderButtons()}
        {this.state.selectedDevice ? this.renderTutorialsteps() : null}
        {this.renderContinueButton()}
      </div>
    );
  }

  render() {
    if (this.props.browserSupported) {
      return this.renderConnectScreen();
    }
    return this.renderUnsupportedBrowser();
  }
}
