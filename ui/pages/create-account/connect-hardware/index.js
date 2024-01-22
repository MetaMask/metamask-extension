import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as actions from '../../../store/actions';
import {
  getCurrentChainId,
  getMetaMaskAccounts,
  getRpcPrefsForCurrentProvider,
  getMetaMaskAccountsConnected,
} from '../../../selectors';
import { formatBalance } from '../../../helpers/utils/util';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SECOND } from '../../../../shared/constants/time';
import {
  HardwareDeviceNames,
  LedgerTransportTypes,
} from '../../../../shared/constants/hardware-wallets';
import {
  BUTTON_VARIANT,
  BUTTON_SIZES,
  Button,
  Text,
} from '../../../components/component-library';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { TextColor } from '../../../helpers/constants/design-system';
import SelectHardware from './select-hardware';
import AccountList from './account-list';

const U2F_ERROR = 'U2F';
const LEDGER_ERRORS_CODES = {
  '0x650f': 'ledgerErrorConnectionIssue',
  '0x5515': 'ledgerErrorDevicedLocked',
  '0x6501': 'ledgerErrorEthAppNotOpen',
  '0x6a80': 'ledgerErrorTransactionDataNotPadded',
};

const LEDGER_LIVE_PATH = `m/44'/60'/0'/0/0`;
const MEW_PATH = `m/44'/60'/0'`;
const BIP44_PATH = `m/44'/60'/0'/0`;
export const LEDGER_HD_PATHS = [
  { name: 'Ledger Live', value: LEDGER_LIVE_PATH },
  { name: 'Legacy (MEW / MyCrypto)', value: MEW_PATH },
  { name: `BIP44 Standard (e.g. MetaMask, Trezor)`, value: BIP44_PATH },
];

const LATTICE_STANDARD_BIP44_PATH = `m/44'/60'/0'/0/x`;
const LATTICE_LEDGER_LIVE_PATH = `m/44'/60'/x'/0/0`;
const LATTICE_MEW_PATH = `m/44'/60'/0'/x`;
export const LATTICE_HD_PATHS = [
  {
    name: `Standard (${LATTICE_STANDARD_BIP44_PATH})`,
    value: LATTICE_STANDARD_BIP44_PATH,
  },
  {
    name: `Ledger Live (${LATTICE_LEDGER_LIVE_PATH})`,
    value: LATTICE_LEDGER_LIVE_PATH,
  },
  { name: `Ledger Legacy (${LATTICE_MEW_PATH})`, value: LATTICE_MEW_PATH },
];

const TREZOR_TESTNET_PATH = `m/44'/1'/0'/0`;
export const TREZOR_HD_PATHS = [
  { name: `BIP44 Standard (e.g. MetaMask, Trezor)`, value: BIP44_PATH },
  { name: `Legacy (Ledger / MEW / MyCrypto)`, value: MEW_PATH },
  { name: `Trezor Testnets`, value: TREZOR_TESTNET_PATH },
];

const HD_PATHS = {
  ledger: LEDGER_HD_PATHS,
  lattice: LATTICE_HD_PATHS,
  trezor: TREZOR_HD_PATHS,
};

const getErrorMessage = (errorCode, t) => {
  switch (errorCode) {
    case '0x650f':
      return t('ledgerErrorConnectionIssue');
    case '0x5515':
      return t('ledgerErrorDevicedLocked');
    case '0x6501':
      return t('ledgerErrorEthAppNotOpen');
    case '0x6a80':
      return t('ledgerErrorTransactionDataNotPadded');
    default:
      return errorCode;
  }
};

class ConnectHardwareForm extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    error: null,
    selectedAccounts: [],
    accounts: [],
    browserSupported: true,
    unlocked: false,
    device: null,
    isFirefox: false,
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { accounts } = nextProps;
    const newAccounts = this.state.accounts.map((a) => {
      const normalizedAddress = a.address.toLowerCase();
      const balanceValue = accounts[normalizedAddress]?.balance || null;
      a.balance = balanceValue ? formatBalance(balanceValue, 6) : '...';
      return a;
    });
    this.setState({ accounts: newAccounts });
  }

  componentDidMount() {
    this.checkIfUnlocked();
    const useAgent = window.navigator.userAgent;
    if (/Firefox/u.test(useAgent)) {
      this.setState({ isFirefox: true });
    }
  }

  async checkIfUnlocked() {
    for (const device of [
      HardwareDeviceNames.trezor,
      HardwareDeviceNames.ledger,
      HardwareDeviceNames.lattice,
    ]) {
      const path = this.props.defaultHdPaths[device];
      const unlocked = await this.props.checkHardwareStatus(device, path);
      if (unlocked) {
        this.setState({ unlocked: true });
        this.getPage(device, 0, path);
      }
    }
  }

  connectToHardwareWallet = (device) => {
    this.setState({ device });
    if (this.state.accounts.length) {
      return;
    }

    // Default values
    this.getPage(device, 0, this.props.defaultHdPaths[device]);
  };

  onPathChange = (path) => {
    this.props.setHardwareWalletDefaultHdPath({
      device: this.state.device,
      path,
    });
    this.setState({
      selectedAccounts: [],
    });
    this.getPage(this.state.device, 0, path);
  };

  onAccountChange = (account) => {
    let { selectedAccounts } = this.state;
    if (selectedAccounts.includes(account)) {
      selectedAccounts = selectedAccounts.filter((acc) => account !== acc);
    } else {
      selectedAccounts.push(account);
    }
    this.setState({ selectedAccounts, error: null });
  };

  onAccountRestriction = () => {
    this.setState({ error: this.context.t('ledgerAccountRestriction') });
  };

  showTemporaryAlert() {
    this.props.showAlert(this.context.t('hardwareWalletConnected'));
    // Autohide the alert after 5 seconds
    setTimeout((_) => {
      this.props.hideAlert();
    }, SECOND * 5);
  }

  getPage = (device, page, hdPath) => {
    this.props
      .connectHardware(device, page, hdPath, this.context.t)
      .then((accounts) => {
        if (accounts.length) {
          // If we just loaded the accounts for the first time
          // (device previously locked) show the global alert
          if (this.state.accounts.length === 0 && !this.state.unlocked) {
            this.showTemporaryAlert();
          }

          // Map accounts with balances
          const newAccounts = accounts.map((account) => {
            const normalizedAddress = account.address.toLowerCase();
            const balanceValue =
              this.props.accounts[normalizedAddress]?.balance || null;
            account.balance = balanceValue
              ? formatBalance(balanceValue, 6)
              : '...';
            return account;
          });

          this.setState({
            accounts: newAccounts,
            unlocked: true,
            device,
            error: null,
          });
        }
      })
      .catch((e) => {
        const errorMessage = typeof e === 'string' ? e : e.message;
        const ledgerErrorCode = Object.keys(LEDGER_ERRORS_CODES).find(
          (errorCode) => errorMessage.includes(errorCode),
        );
        if (errorMessage === 'Window blocked') {
          this.setState({ browserSupported: false, error: null });
        } else if (errorMessage.includes(U2F_ERROR)) {
          this.setState({ error: U2F_ERROR });
        } else if (
          errorMessage === 'LEDGER_LOCKED' ||
          errorMessage === 'LEDGER_WRONG_APP'
        ) {
          this.setState({
            error: this.context.t('ledgerLocked'),
          });
        } else if (errorMessage.includes('timeout')) {
          this.setState({
            error: this.context.t('ledgerTimeout'),
          });
        } else if (ledgerErrorCode) {
          this.setState({
            error: `${errorMessage} - ${getErrorMessage(ledgerErrorCode)}`,
          });
        } else if (
          errorMessage
            .toLowerCase()
            .includes(
              'KeystoneError#pubkey_account.no_expected_account'.toLowerCase(),
            )
        ) {
          this.setState({
            error: this.context.t('QRHardwarePubkeyAccountOutOfRange'),
          });
        } else if (
          errorMessage !== 'Window closed' &&
          errorMessage !== 'Popup closed' &&
          errorMessage
            .toLowerCase()
            .includes('KeystoneError#sync_cancel'.toLowerCase()) === false
        ) {
          this.setState({
            error: errorMessage,
          });
        }
      });
  };

  onForgetDevice = (device) => {
    this.props
      .forgetDevice(device)
      .then((_) => {
        this.setState({
          error: null,
          selectedAccounts: [],
          accounts: [],
          unlocked: false,
        });
      })
      .catch((e) => {
        this.setState({ error: e.message });
      });
  };

  onUnlockAccounts = (device, path) => {
    const { history, mostRecentOverviewPage, unlockHardwareWalletAccounts } =
      this.props;
    const { selectedAccounts } = this.state;

    if (selectedAccounts.length === 0) {
      this.setState({ error: this.context.t('accountSelectionRequired') });
    }

    const description =
      MEW_PATH === path
        ? this.context.t('hardwareWalletLegacyDescription')
        : '';
    return unlockHardwareWalletAccounts(
      selectedAccounts,
      device,
      path || null,
      description,
    )
      .then((_) => {
        this.context.trackEvent({
          category: MetaMetricsEventCategory.Accounts,
          event: MetaMetricsEventName.AccountAdded,
          properties: {
            account_type: MetaMetricsEventAccountType.Hardware,
            account_hardware_type: device,
          },
        });
        history.push(mostRecentOverviewPage);
      })
      .catch((e) => {
        this.context.trackEvent({
          category: MetaMetricsEventCategory.Accounts,
          event: MetaMetricsEventName.AccountAddFailed,
          properties: {
            account_type: MetaMetricsEventAccountType.Hardware,
            account_hardware_type: device,
            error: e.message,
          },
        });
        this.setState({ error: e.message });
      });
  };

  onCancel = () => {
    const { history, mostRecentOverviewPage } = this.props;
    history.push(mostRecentOverviewPage);
  };

  renderError() {
    if (this.state.error === U2F_ERROR) {
      if (this.state.device === 'ledger' && this.state.isFirefox) {
        return (
          <>
            <Text color={TextColor.warningDefault} margin={[5, 5, 2]}>
              {this.context.t('troubleConnectingToLedgerU2FOnFirefox', [
                // eslint-disable-next-line react/jsx-key
                <Button
                  variant={BUTTON_VARIANT.LINK}
                  href={ZENDESK_URLS.HARDWARE_CONNECTION}
                  size={BUTTON_SIZES.INHERIT}
                  key="u2f-error-1"
                  as="a"
                  block={false}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {this.context.t('troubleConnectingToLedgerU2FOnFirefox2')}
                </Button>,
              ])}
            </Text>
            <Text color={TextColor.warningDefault} margin={[5, 5, 2]}>
              {this.context.t(
                'troubleConnectingToLedgerU2FOnFirefoxLedgerSolution',
                [
                  // eslint-disable-next-line react/jsx-key
                  <Button
                    variant={BUTTON_VARIANT.LINK}
                    href={ZENDESK_URLS.LEDGER_FIREFOX_U2F_GUIDE}
                    size={BUTTON_SIZES.INHERIT}
                    key="u2f-error-1"
                    as="a"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {this.context.t(
                      'troubleConnectingToLedgerU2FOnFirefoxLedgerSolution2',
                    )}
                  </Button>,
                ],
              )}
            </Text>
          </>
        );
      }
      return (
        <Text color={TextColor.warningDefault} margin={[5, 5, 2]}>
          {this.context.t('troubleConnectingToWallet', [
            this.state.device,
            // eslint-disable-next-line react/jsx-key
            <Button
              variant={BUTTON_VARIANT.LINK}
              href={ZENDESK_URLS.HARDWARE_CONNECTION}
              key="u2f-error-1"
            >
              {this.context.t('walletConnectionGuide')}
            </Button>,
          ])}
        </Text>
      );
    }
    return this.state.error ? (
      <span className="hw-connect__error">{this.state.error}</span>
    ) : null;
  }

  renderContent() {
    if (!this.state.accounts.length) {
      return (
        <SelectHardware
          connectToHardwareWallet={this.connectToHardwareWallet}
          browserSupported={this.state.browserSupported}
          ledgerTransportType={this.props.ledgerTransportType}
          onCancel={this.onCancel}
        />
      );
    }

    return (
      <AccountList
        onPathChange={this.onPathChange}
        selectedPath={this.props.defaultHdPaths[this.state.device]}
        device={this.state.device}
        accounts={this.state.accounts}
        connectedAccounts={this.props.connectedAccounts}
        selectedAccounts={this.state.selectedAccounts}
        onAccountChange={this.onAccountChange}
        chainId={this.props.chainId}
        rpcPrefs={this.props.rpcPrefs}
        getPage={this.getPage}
        onUnlockAccounts={this.onUnlockAccounts}
        onForgetDevice={this.onForgetDevice}
        onCancel={this.onCancel}
        onAccountRestriction={this.onAccountRestriction}
        hdPaths={HD_PATHS}
      />
    );
  }

  render() {
    return (
      <>
        {this.renderError()}
        {this.renderContent()}
      </>
    );
  }
}

ConnectHardwareForm.propTypes = {
  connectHardware: PropTypes.func,
  checkHardwareStatus: PropTypes.func,
  forgetDevice: PropTypes.func,
  showAlert: PropTypes.func,
  hideAlert: PropTypes.func,
  unlockHardwareWalletAccounts: PropTypes.func,
  setHardwareWalletDefaultHdPath: PropTypes.func,
  history: PropTypes.object,
  chainId: PropTypes.string,
  rpcPrefs: PropTypes.object,
  accounts: PropTypes.object,
  connectedAccounts: PropTypes.array.isRequired,
  defaultHdPaths: PropTypes.object,
  mostRecentOverviewPage: PropTypes.string.isRequired,
  ledgerTransportType: PropTypes.oneOf(Object.values(LedgerTransportTypes)),
};

const mapStateToProps = (state) => ({
  chainId: getCurrentChainId(state),
  rpcPrefs: getRpcPrefsForCurrentProvider(state),
  accounts: getMetaMaskAccounts(state),
  connectedAccounts: getMetaMaskAccountsConnected(state),
  defaultHdPaths: state.appState.defaultHdPaths,
  mostRecentOverviewPage: getMostRecentOverviewPage(state),
  ledgerTransportType: state.metamask.ledgerTransportType,
});

const mapDispatchToProps = (dispatch) => {
  return {
    setHardwareWalletDefaultHdPath: ({ device, path }) => {
      return dispatch(actions.setHardwareWalletDefaultHdPath({ device, path }));
    },
    connectHardware: (deviceName, page, hdPath, t) => {
      return dispatch(actions.connectHardware(deviceName, page, hdPath, t));
    },
    checkHardwareStatus: (deviceName, hdPath) => {
      return dispatch(actions.checkHardwareStatus(deviceName, hdPath));
    },
    forgetDevice: (deviceName) => {
      return dispatch(actions.forgetDevice(deviceName));
    },
    unlockHardwareWalletAccounts: (
      indexes,
      deviceName,
      hdPath,
      hdPathDescription,
    ) => {
      return dispatch(
        actions.unlockHardwareWalletAccounts(
          indexes,
          deviceName,
          hdPath,
          hdPathDescription,
        ),
      );
    },
    showAlert: (msg) => dispatch(actions.showAlert(msg)),
    hideAlert: () => dispatch(actions.hideAlert()),
  };
};

ConnectHardwareForm.contextTypes = {
  t: PropTypes.func,
  trackEvent: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConnectHardwareForm);
