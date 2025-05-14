import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as actions from '../../../store/actions';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import {
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
import { HardwareDeviceNames } from '../../../../shared/constants/hardware-wallets';
import {
  BUTTON_VARIANT,
  BUTTON_SIZES,
  Button,
  Text,
} from '../../../components/component-library';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { TextColor } from '../../../helpers/constants/design-system';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import AccountList from './account-list';
import SelectHardware from './select-hardware';
import useLedgerDMK from '../../confirmations/hooks/useLedgerDMK';

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
  { name: 'BIP44 Standard (e.g. MetaMask, Trezor)', value: BIP44_PATH },
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
  { name: 'BIP44 Standard (e.g. MetaMask, Trezor)', value: BIP44_PATH },
  { name: 'Legacy (Ledger / MEW / MyCrypto)', value: MEW_PATH },
  { name: 'Trezor Testnets', value: TREZOR_TESTNET_PATH },
];

const HD_PATHS = {
  ledger: LEDGER_HD_PATHS,
  lattice: LATTICE_HD_PATHS,
  trezor: TREZOR_HD_PATHS,
  oneKey: TREZOR_HD_PATHS,
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

function ConnectHardwareForm(props) {
  const {
    connectHardware,
    checkHardwareStatus,
    forgetDevice,
    showAlert,
    hideAlert,
    unlockHardwareWalletAccounts,
    setHardwareWalletDefaultHdPath,
    history,
    chainId,
    rpcPrefs,
    accounts: propsAccounts,
    connectedAccounts,
    defaultHdPaths,
    mostRecentOverviewPage,
    ledgerTransportType,
    hdEntropyIndex,
  } = props;

  // State variables using hooks
  const [error, setError] = useState(null);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [device, setDevice] = useState(null);
  const [isFirefox, setIsFirefox] = useState(false);

  const { ledgerDmk, initLedgerDMK, connectLedger } = useLedgerDMK();

  // Getting context for translations and tracking
  // In a real implementation, we would use useContext with a proper React.Context
  // For simplicity in this refactor, we'll simulate using the same context API pattern
  const t = useCallback(
    (key, replacements) => {
      if (typeof props.t === 'function') {
        return props.t(key, replacements);
      }
      return key;
    },
    [props.t],
  ); // Add dependency array with props.t

  // Function to show temporary alert
  const showTemporaryAlert = useCallback(() => {
    showAlert(t('hardwareWalletConnected'));
    // Autohide the alert after 5 seconds
    setTimeout(() => {
      hideAlert();
    }, SECOND * 5);
  }, [showAlert, hideAlert, t]);

  // Get page of accounts
  const getPage = useCallback(
    (deviceName, page, hdPath, loadHid) => {
      if (!ledgerDmk) {
        initLedgerDMK();
      }

      connectLedger();

      connectHardware(deviceName, page, hdPath, loadHid, t)
        .then((fetchedAccounts) => {
          if (fetchedAccounts.length) {
            // If we just loaded the accounts for the first time
            // (device previously locked) show the global alert
            if (accounts.length === 0 && !unlocked) {
              showTemporaryAlert();
            }

            // Map accounts with balances
            const newAccounts = fetchedAccounts.map((account) => {
              const normalizedAddress = account.address.toLowerCase();
              const balanceValue =
                propsAccounts[normalizedAddress]?.balance || null;
              account.balance = balanceValue
                ? formatBalance(balanceValue, 6)
                : '...';
              return account;
            });

            setAccounts(newAccounts);
            setUnlocked(true);
            setDevice(deviceName);
            setError(null);
          }
        })
        .catch((e) => {
          const errorMessage = typeof e === 'string' ? e : e.message;
          const ledgerErrorCode = Object.keys(LEDGER_ERRORS_CODES).find(
            (errorCode) => errorMessage.includes(errorCode),
          );
          if (errorMessage === 'Window blocked') {
            setBrowserSupported(false);
            setError(null);
          } else if (errorMessage.includes(U2F_ERROR)) {
            setError(U2F_ERROR);
          } else if (
            errorMessage === 'LEDGER_LOCKED' ||
            errorMessage === 'LEDGER_WRONG_APP'
          ) {
            setError(t('ledgerLocked'));
          } else if (errorMessage.includes('timeout')) {
            setError(t('ledgerTimeout'));
          } else if (ledgerErrorCode) {
            setError(
              `${errorMessage} - ${getErrorMessage(ledgerErrorCode, t)}`,
            );
          } else if (
            errorMessage
              .toLowerCase()
              .includes(
                'KeystoneError#pubkey_account.no_expected_account'.toLowerCase(),
              )
          ) {
            setError(t('QRHardwarePubkeyAccountOutOfRange'));
          } else if (
            errorMessage !== 'Window closed' &&
            errorMessage !== 'Popup closed' &&
            errorMessage
              .toLowerCase()
              .includes('KeystoneError#sync_cancel'.toLowerCase()) === false
          ) {
            setError(errorMessage);
          }
        });
    },
    [
      connectHardware,
      propsAccounts,
      accounts.length,
      unlocked,
      showTemporaryAlert,
      t,
      ledgerDmk,
      initLedgerDMK,
    ],
  );

  const trackEvent = useCallback(
    (eventData) => {
      if (typeof props.trackEvent === 'function') {
        props.trackEvent(eventData);
      }
    },
    [props.trackEvent],
  ); // Add dependency array with props.trackEvent
  // Update accounts when props.accounts changes
  useEffect(() => {
    if (accounts.length > 0 && propsAccounts) {
      const newAccounts = accounts.map((a) => {
        const normalizedAddress = a.address.toLowerCase();
        const balanceValue = propsAccounts[normalizedAddress]?.balance || null;
        a.balance = balanceValue ? formatBalance(balanceValue, 6) : '...';
        return a;
      });
      setAccounts(newAccounts);
    }
  }, [propsAccounts, accounts]);

  // Check if device is unlocked on mount
  useEffect(() => {
    const checkIfUnlocked = async () => {
      for (const deviceName of [
        HardwareDeviceNames.trezor,
        HardwareDeviceNames.oneKey,
        HardwareDeviceNames.ledger,
        HardwareDeviceNames.lattice,
      ]) {
        const path = defaultHdPaths[deviceName];
        const deviceUnlocked = await checkHardwareStatus(deviceName, path);
        if (deviceUnlocked && device) {
          setUnlocked(true);
          getPage(deviceName, 0, path);
        }
      }
    };

    checkIfUnlocked();

    // Check if browser is Firefox
    const { userAgent } = window.navigator;
    if (/Firefox/u.test(userAgent)) {
      setIsFirefox(true);
    }
  }, [checkHardwareStatus, defaultHdPaths, device, getPage]);

  // Connect to hardware wallet
  const connectToHardwareWallet = useCallback(
    (deviceName) => {
      setDevice(deviceName);
      if (accounts.length) {
        return;
      }

      // Default values
      getPage(deviceName, 0, defaultHdPaths[deviceName], true);
    },
    [accounts.length, defaultHdPaths, getPage],
  );

  // Handle path change
  const onPathChange = useCallback(
    (path) => {
      setHardwareWalletDefaultHdPath({
        device,
        path,
      });
      setSelectedAccounts([]);
      getPage(device, 0, path);
    },
    [device, setHardwareWalletDefaultHdPath, getPage],
  );

  // Handle account selection
  const onAccountChange = useCallback(
    (account) => {
      let updatedAccounts = [...selectedAccounts];
      if (updatedAccounts.includes(account)) {
        updatedAccounts = updatedAccounts.filter((acc) => account !== acc);
      } else {
        updatedAccounts.push(account);
      }
      setSelectedAccounts(updatedAccounts);
      setError(null);
    },
    [selectedAccounts],
  );

  // Handle account restriction
  const onAccountRestriction = useCallback(() => {
    setError(t('ledgerAccountRestriction'));
  }, [t]);

  // Handle forget device
  const onForgetDevice = useCallback(
    (deviceName) => {
      forgetDevice(deviceName)
        .then(() => {
          setError(null);
          setSelectedAccounts([]);
          setAccounts([]);
          setUnlocked(false);
        })
        .catch((e) => {
          setError(e.message);
        });
    },
    [forgetDevice],
  );

  // Handle unlock accounts
  const onUnlockAccounts = useCallback(
    async (deviceName, path) => {
      if (selectedAccounts.length === 0) {
        setError(t('accountSelectionRequired'));
        return;
      }

      const description =
        MEW_PATH === path ? t('hardwareWalletLegacyDescription') : '';

      unlockHardwareWalletAccounts(
        selectedAccounts,
        deviceName,
        path || null,
        description,
      )
        .then(() => {
          trackEvent({
            category: MetaMetricsEventCategory.Accounts,
            event: MetaMetricsEventName.AccountAdded,
            properties: {
              account_type: MetaMetricsEventAccountType.Hardware,
              // For now we keep using the device name to avoid any discrepancies with our current metrics.
              // TODO: This will be addressed later, see: https://github.com/MetaMask/metamask-extension/issues/29777
              account_hardware_type: deviceName,
              is_suggested_name: true,
            },
          });
          history.push(mostRecentOverviewPage);
        })
        .catch((e) => {
          trackEvent({
            category: MetaMetricsEventCategory.Accounts,
            event: MetaMetricsEventName.AccountAddFailed,
            properties: {
              account_type: MetaMetricsEventAccountType.Hardware,
              // See comment above about `account_hardware_type`.
              account_hardware_type: deviceName,
              error: e.message,
              hd_entropy_index: hdEntropyIndex,
            },
          });
          setError(e.message);
        });
    },
    [
      selectedAccounts,
      t,
      unlockHardwareWalletAccounts,
      trackEvent,
      history,
      mostRecentOverviewPage,
      hdEntropyIndex,
    ],
  );

  // Handle cancel
  const onCancel = useCallback(() => {
    history.push(mostRecentOverviewPage);
  }, [history, mostRecentOverviewPage]);

  // Render error
  const renderError = () => {
    if (error === U2F_ERROR) {
      if (device === 'ledger' && isFirefox) {
        return (
          <>
            <Text color={TextColor.warningDefault} margin={[5, 5, 2]}>
              {t('troubleConnectingToLedgerU2FOnFirefox', [
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
                  {t('troubleConnectingToLedgerU2FOnFirefox2')}
                </Button>,
              ])}
            </Text>
            <Text color={TextColor.warningDefault} margin={[5, 5, 2]}>
              {t('troubleConnectingToLedgerU2FOnFirefoxLedgerSolution', [
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
                  {t('troubleConnectingToLedgerU2FOnFirefoxLedgerSolution2')}
                </Button>,
              ])}
            </Text>
          </>
        );
      }
      return (
        <Text color={TextColor.warningDefault} margin={[5, 5, 2]}>
          {t('troubleConnectingToWallet', [
            device,
            // eslint-disable-next-line react/jsx-key
            <Button
              variant={BUTTON_VARIANT.LINK}
              href={ZENDESK_URLS.HARDWARE_CONNECTION}
              key="u2f-error-1"
            >
              {t('walletConnectionGuide')}
            </Button>,
          ])}
        </Text>
      );
    }
    return error ? <span className="hw-connect__error">{error}</span> : null;
  };

  // Render content
  const renderContent = () => {
    if (!accounts.length) {
      return (
        <SelectHardware
          connectToHardwareWallet={connectToHardwareWallet}
          browserSupported={browserSupported}
          ledgerTransportType={ledgerTransportType}
          onCancel={onCancel}
        />
      );
    }

    return (
      <AccountList
        onPathChange={onPathChange}
        selectedPath={defaultHdPaths[device]}
        device={device}
        accounts={accounts}
        connectedAccounts={connectedAccounts}
        selectedAccounts={selectedAccounts}
        onAccountChange={onAccountChange}
        chainId={chainId}
        rpcPrefs={rpcPrefs}
        getPage={getPage}
        onUnlockAccounts={onUnlockAccounts}
        onForgetDevice={onForgetDevice}
        onCancel={onCancel}
        onAccountRestriction={onAccountRestriction}
        hdPaths={HD_PATHS}
      />
    );
  };

  return (
    <>
      {renderError()}
      {renderContent()}
    </>
  );
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
  ledgerTransportType: PropTypes.string,
  hdEntropyIndex: PropTypes.number,
  t: PropTypes.func,
  trackEvent: PropTypes.func,
};

const mapStateToProps = (state) => ({
  chainId: getCurrentChainId(state),
  rpcPrefs: getRpcPrefsForCurrentProvider(state),
  accounts: getMetaMaskAccounts(state),
  connectedAccounts: getMetaMaskAccountsConnected(state),
  defaultHdPaths: state.appState.defaultHdPaths,
  mostRecentOverviewPage: getMostRecentOverviewPage(state),
  ledgerTransportType: state.metamask.ledgerTransportType,
  hdEntropyIndex: getHDEntropyIndex(state),
});

const mapDispatchToProps = (dispatch) => {
  return {
    setHardwareWalletDefaultHdPath: ({ device, path }) => {
      return dispatch(actions.setHardwareWalletDefaultHdPath({ device, path }));
    },
    connectHardware: (deviceName, page, hdPath, loadHid, t) => {
      return dispatch(
        actions.connectHardware(deviceName, page, hdPath, loadHid, t),
      );
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
