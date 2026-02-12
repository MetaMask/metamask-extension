/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable react-compiler/react-compiler */
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { upperFirst } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { KeyringObject } from '@metamask/keyring-controller';
import * as actions from '../../../store/actions';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { getErrorMessage as toErrorMessage } from '../../../../shared/modules/error';
import {
  getMetaMaskAccounts,
  getRpcPrefsForCurrentProvider,
  getMetaMaskAccountsConnected,
} from '../../../selectors';
import { formatBalance } from '../../../helpers/utils/util';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { SECOND } from '../../../../shared/constants/time';
import {
  HardwareDeviceNames,
  U2F_ERROR,
  LEDGER_ERRORS_CODES,
  LEDGER_LIVE_PATH,
  MEW_PATH,
  BIP44_PATH,
  LATTICE_STANDARD_BIP44_PATH,
  LATTICE_LEDGER_LIVE_PATH,
  LATTICE_MEW_PATH,
  TREZOR_TESTNET_PATH,
  DEVICE_KEYRING_MAP,
} from '../../../../shared/constants/hardware-wallets';
import {
  Button,
  ButtonVariant,
  ButtonSize,
  Text,
} from '../../../components/component-library';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { TextColor } from '../../../helpers/constants/design-system';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { KeyringType } from '../../../../shared/constants/keyring';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import AccountList from './account-list';
import SelectHardware from './select-hardware';

export const LEDGER_HD_PATHS = [
  { name: 'Ledger Live', value: LEDGER_LIVE_PATH },
  { name: 'Legacy (MEW / MyCrypto)', value: MEW_PATH },
  { name: `BIP44 Standard (e.g. MetaMask, Trezor)`, value: BIP44_PATH },
];

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

export const TREZOR_HD_PATHS = [
  { name: `BIP44 Standard (e.g. MetaMask, Trezor)`, value: BIP44_PATH },
  { name: `Legacy (Ledger / MEW / MyCrypto)`, value: MEW_PATH },
  { name: `Trezor Testnets`, value: TREZOR_TESTNET_PATH },
];

const HD_PATHS: Record<string, { name: string; value: string }[]> = {
  ledger: LEDGER_HD_PATHS,
  lattice: LATTICE_HD_PATHS,
  trezor: TREZOR_HD_PATHS,
  oneKey: TREZOR_HD_PATHS,
};

type HardwareAccount = {
  address: string;
  balance: string;
  index: number;
};

const getErrorMessage = (
  errorCode: string,
  t: (key: string) => string,
): string => {
  const errorCodeLocalized =
    LEDGER_ERRORS_CODES[errorCode as keyof typeof LEDGER_ERRORS_CODES];
  if (errorCodeLocalized !== undefined) {
    return t(errorCodeLocalized);
  }
  return errorCode;
};

const ConnectHardwareForm = () => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const dispatch: MetaMaskReduxDispatch = useDispatch();
  const navigate = useNavigate();

  // Selectors
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const accounts = useSelector(getMetaMaskAccounts) as Record<
    string,
    { balance?: string }
  >;
  const connectedAccounts = useSelector(
    getMetaMaskAccountsConnected,
  ) as string[];
  const defaultHdPaths = useSelector(
    (state: { appState: { defaultHdPaths: Record<string, string> } }) =>
      state.appState.defaultHdPaths,
  );
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const keyrings = useSelector(
    (state: { metamask: { keyrings: KeyringObject[] } }) =>
      state.metamask.keyrings,
  );

  // Local state
  const [error, setError] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [hardwareAccounts, setHardwareAccounts] = useState<HardwareAccount[]>(
    [],
  );
  const [browserSupported, setBrowserSupported] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [device, setDevice] = useState<string | null>(null);
  const [isFirefox, setIsFirefox] = useState(false);

  const hardwareWalletKeyrings = useMemo(
    () =>
      keyrings.filter(
        (keyring) =>
          (
            [
              KeyringType.ledger,
              KeyringType.trezor,
              KeyringType.lattice,
              KeyringType.qr,
              KeyringType.oneKey,
            ] as string[]
          ).includes(keyring.type) && keyring.accounts.length > 0,
      ),
    [keyrings],
  );

  // Update balances when accounts change
  useEffect(() => {
    setHardwareAccounts((prev) =>
      prev.map((account) => {
        const normalizedAddress = account.address.toLowerCase();
        const balanceValue = accounts[normalizedAddress]?.balance || null;
        return {
          ...account,
          balance: balanceValue ? formatBalance(balanceValue, 6) : '...',
        };
      }),
    );
  }, [accounts]);

  const showTemporaryAlert = useCallback(() => {
    dispatch(actions.showAlert(t('hardwareWalletConnected') as string));
    setTimeout(() => {
      dispatch(actions.hideAlert());
    }, SECOND * 5);
  }, [dispatch, t]);

  const getPage = useCallback(
    async (
      deviceName: string,
      page: number,
      hdPath: string,
      loadHid?: boolean,
    ) => {
      // The actions.ts type declares `page` as string, but the background
      // handler expects a number (0 = first, 1 = next, -1 = previous).
      // The original JS code always passed numbers.
      try {
        const nextAccounts = (await dispatch(
          actions.connectHardware(
            deviceName as HardwareDeviceNames,
            page as unknown as string,
            hdPath,
            loadHid ?? false,
            t as (key: string) => string,
          ),
        )) as { address: string; index?: number }[];

        if (nextAccounts.length) {
          if (hardwareAccounts.length === 0 && !unlocked) {
            showTemporaryAlert();
          }

          const newAccounts: HardwareAccount[] = nextAccounts.map(
            (account, idx) => {
              const normalizedAddress = account.address.toLowerCase();
              const balanceValue = accounts[normalizedAddress]?.balance || null;
              return {
                address: account.address,
                index: account.index ?? idx,
                balance: balanceValue ? formatBalance(balanceValue, 6) : '...',
              };
            },
          );

          setHardwareAccounts(newAccounts);
          setUnlocked(true);
          setDevice(deviceName);
          setError(null);
        }
      } catch (e: unknown) {
        const errorMessage = toErrorMessage(e);
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
          setError(t('ledgerLocked') as string);
        } else if (errorMessage.includes('timeout')) {
          setError(t('ledgerTimeout') as string);
        } else if (ledgerErrorCode) {
          setError(
            `${errorMessage} - ${getErrorMessage(ledgerErrorCode, t as (key: string) => string)}`,
          );
        } else if (
          errorMessage
            .toLowerCase()
            .includes(
              'KeystoneError#pubkey_account.no_expected_account'.toLowerCase(),
            )
        ) {
          setError(t('QRHardwarePubkeyAccountOutOfRange') as string);
        } else if (
          errorMessage !== 'Window closed' &&
          errorMessage !== 'Popup closed' &&
          !errorMessage
            .toLowerCase()
            .includes('KeystoneError#sync_cancel'.toLowerCase())
        ) {
          setError(errorMessage);
        }
      }
    },
    [
      accounts,
      dispatch,
      hardwareAccounts.length,
      showTemporaryAlert,
      t,
      unlocked,
    ],
  );

  // Check if device is already unlocked on mount
  useEffect(() => {
    const checkIfUnlocked = async () => {
      for (const deviceName of [
        HardwareDeviceNames.trezor,
        HardwareDeviceNames.oneKey,
        HardwareDeviceNames.ledger,
        HardwareDeviceNames.lattice,
      ]) {
        const path = defaultHdPaths[deviceName];
        const isUnlocked = await dispatch(
          actions.checkHardwareStatus(deviceName, path),
        );
        if (isUnlocked && device) {
          setUnlocked(true);
          getPage(deviceName, 0, path);
        }
      }
    };

    if (/Firefox/u.test(window.navigator.userAgent)) {
      setIsFirefox(true);
    }
    checkIfUnlocked().catch(() => undefined);
    // We only want this to run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectToHardwareWallet = useCallback(
    (nextDevice: string) => {
      setDevice(nextDevice);
      if (hardwareAccounts.length) {
        return;
      }

      const deviceCount = hardwareWalletKeyrings.length;

      trackEvent({
        event: MetaMetricsEventName.ConnectHardwareWalletClicked,
        properties: {
          device_type: upperFirst(nextDevice),
          connected_device_count: deviceCount,
        },
      });

      getPage(nextDevice, 0, defaultHdPaths[nextDevice], true);
    },
    [
      defaultHdPaths,
      getPage,
      hardwareAccounts.length,
      hardwareWalletKeyrings.length,
      trackEvent,
    ],
  );

  const onPathChange = useCallback(
    (path: string) => {
      if (!device) {
        return;
      }
      dispatch(
        actions.setHardwareWalletDefaultHdPath({
          device: device as HardwareDeviceNames,
          path,
        }),
      );
      setSelectedAccounts([]);
      getPage(device, 0, path);
    },
    [device, dispatch, getPage],
  );

  const onAccountChange = useCallback((accountIndex: number) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountIndex)
        ? prev.filter((acc) => accountIndex !== acc)
        : [...prev, accountIndex],
    );
    setError(null);
  }, []);

  const onAccountRestriction = useCallback(() => {
    setError(t('ledgerAccountRestriction') as string);
  }, [t]);

  const onForgetDevice = useCallback(
    async (deviceName: string, hdPath: string) => {
      try {
        await dispatch(actions.forgetDevice(deviceName as HardwareDeviceNames));

        trackEvent({
          event: MetaMetricsEventName.HardwareWalletForgotten,
          properties: {
            device_type: upperFirst(deviceName),
          },
        });

        setError(null);
        setSelectedAccounts([]);
        setHardwareAccounts([]);
        setUnlocked(false);
      } catch (e) {
        const errorMessage = toErrorMessage(e);

        trackEvent({
          event: MetaMetricsEventName.HardwareWalletConnectionFailed,
          properties: {
            hd_path: hdPath,
            device_type: upperFirst(deviceName),
            error: errorMessage,
          },
        });

        setError(errorMessage);
      }
    },
    [dispatch, trackEvent],
  );

  const onUnlockAccounts = useCallback(
    async (deviceName: string, path: string) => {
      if (selectedAccounts.length === 0) {
        setError(t('accountSelectionRequired') as string);
        return;
      }

      const description =
        MEW_PATH === path
          ? (t('hardwareWalletLegacyDescription') as string)
          : '';

      try {
        await dispatch(
          actions.unlockHardwareWalletAccounts(
            selectedAccounts.map(String),
            deviceName as HardwareDeviceNames,
            path || '',
            description,
          ),
        );

        // Legacy event
        trackEvent({
          category: MetaMetricsEventCategory.Accounts,
          event: MetaMetricsEventName.AccountAdded,
          properties: {
            account_type: MetaMetricsEventAccountType.Hardware,
            account_hardware_type: deviceName,
            is_suggested_name: true,
          },
        });

        const connectedDevices = hardwareWalletKeyrings;
        const deviceCount = connectedDevices.length;
        const isAlreadyConnected = connectedDevices.some(
          (keyring) =>
            keyring.type ===
            DEVICE_KEYRING_MAP[deviceName as keyof typeof DEVICE_KEYRING_MAP],
        );

        trackEvent({
          event: MetaMetricsEventName.HardwareWalletAccountConnected,
          properties: {
            device_type: upperFirst(deviceName),
            hd_path: path,
            connected_device_count: isAlreadyConnected
              ? deviceCount
              : deviceCount + 1,
          },
        });

        navigate(mostRecentOverviewPage);
      } catch (e) {
        const errorMessage = toErrorMessage(e);

        // Legacy event
        trackEvent({
          category: MetaMetricsEventCategory.Accounts,
          event: MetaMetricsEventName.AccountAddFailed,
          properties: {
            account_type: MetaMetricsEventAccountType.Hardware,
            account_hardware_type: deviceName,
            error: errorMessage,
            hd_entropy_index: hdEntropyIndex,
          },
        });

        trackEvent({
          event: MetaMetricsEventName.HardwareWalletConnectionFailed,
          properties: {
            hd_path: path,
            device_type: upperFirst(deviceName),
            error: errorMessage,
          },
        });
        setError(errorMessage);
      }
    },
    [
      dispatch,
      hardwareWalletKeyrings,
      hdEntropyIndex,
      mostRecentOverviewPage,
      navigate,
      selectedAccounts,
      t,
      trackEvent,
    ],
  );

  const onCancel = useCallback(() => {
    navigate(mostRecentOverviewPage);
  }, [mostRecentOverviewPage, navigate]);

  const renderError = () => {
    if (error === U2F_ERROR) {
      if (device === 'ledger' && isFirefox) {
        return (
          <>
            <Text color={TextColor.warningDefault} margin={[5, 5, 2]}>
              {t('troubleConnectingToLedgerU2FOnFirefox', [
                <Button
                  variant={ButtonVariant.Link}
                  href={ZENDESK_URLS.HARDWARE_CONNECTION}
                  size={ButtonSize.Inherit}
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
                <Button
                  variant={ButtonVariant.Link}
                  href={ZENDESK_URLS.LEDGER_FIREFOX_U2F_GUIDE}
                  size={ButtonSize.Inherit}
                  key="u2f-error-2"
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
            <Button
              variant={ButtonVariant.Link}
              href={ZENDESK_URLS.HARDWARE_CONNECTION}
              key="u2f-error-1"
            >
              {t('walletConnectionGuide')}
            </Button>,
          ])}
        </Text>
      );
    }
    return error ? (
      <Text color={TextColor.errorDefault} className="hw-connect__error">
        {error}
      </Text>
    ) : null;
  };

  const renderContent = () => {
    if (!hardwareAccounts.length) {
      return (
        <SelectHardware
          connectToHardwareWallet={connectToHardwareWallet}
          browserSupported={browserSupported}
          onCancel={onCancel}
        />
      );
    }

    if (!device) {
      return null;
    }

    return (
      <AccountList
        onPathChange={onPathChange}
        selectedPath={defaultHdPaths[device]}
        device={device}
        accounts={hardwareAccounts}
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
};

export default ConnectHardwareForm;
