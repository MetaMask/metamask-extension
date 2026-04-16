/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable react-compiler/react-compiler */
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { upperFirst } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { KeyringObject } from '@metamask/keyring-controller';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import {
  Box,
  Text,
  TextButton,
  TextColor,
} from '@metamask/design-system-react';
import * as actions from '../../../store/actions';
import { getCurrentChainId } from '../../../../shared/lib/selectors/networks';
import { getErrorMessage as toErrorMessage } from '../../../../shared/lib/error';
import {
  getMetaMaskAccounts,
  getRpcPrefsForCurrentProvider,
  getMetaMaskAccountsConnected,
  getActiveQrCodeScanRequest,
} from '../../../selectors';
import { formatBalance } from '../../../helpers/utils/util';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { SECOND } from '../../../../shared/constants/time';
import {
  HardwareDeviceNames,
  LedgerTransportTypes,
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
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { KeyringType } from '../../../../shared/constants/keyring';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  toHardwareWalletError,
  HardwareWalletType,
} from '../../../contexts/hardware-wallets';
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

type ActiveQrCodeScanRequest = {
  type?: QrScanRequestType;
} | null;

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
  const ledgerTransportType = useSelector(
    (state: {
      metamask: { ledgerTransportType?: LedgerTransportTypes | 'live' };
    }) => state.metamask.ledgerTransportType,
  );
  const keyrings = useSelector(
    (state: { metamask: { keyrings: KeyringObject[] } }) =>
      state.metamask.keyrings,
  );
  const activeQrCodeScanRequest = useSelector(
    getActiveQrCodeScanRequest,
  ) as ActiveQrCodeScanRequest;

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
  const previousActiveQrCodeScanRequest = useRef<ActiveQrCodeScanRequest>(
    activeQrCodeScanRequest,
  );
  const latestHardwareAccounts = useRef(hardwareAccounts);
  const latestDevice = useRef(device);
  const latestPendingDevice = useRef<string | null>(null);
  const latestGetPageRequestId = useRef(0);

  useEffect(() => {
    latestHardwareAccounts.current = hardwareAccounts;
  }, [hardwareAccounts]);

  useEffect(() => {
    latestDevice.current = device;
  }, [device]);

  const setCurrentDevice = useCallback((nextDevice: string | null) => {
    latestDevice.current = nextDevice;
    setDevice(nextDevice);
  }, []);

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
    setHardwareAccounts((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      return prev.map((account) => {
        const normalizedAddress = account.address.toLowerCase();
        const balanceValue = accounts[normalizedAddress]?.balance || null;
        return {
          ...account,
          balance: balanceValue ? formatBalance(balanceValue, 6) : '...',
        };
      });
    });
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
      shouldShowConnectedAlert = true,
    ) => {
      // The actions.ts type declares `page` as string, but the background
      // handler expects a number (0 = first, 1 = next, -1 = previous).
      const requestId = latestGetPageRequestId.current + 1;
      latestGetPageRequestId.current = requestId;
      latestPendingDevice.current = deviceName;

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

        if (requestId !== latestGetPageRequestId.current) {
          return;
        }

        latestPendingDevice.current = null;

        if (nextAccounts.length) {
          if (
            shouldShowConnectedAlert &&
            hardwareAccounts.length === 0 &&
            !unlocked
          ) {
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
          setCurrentDevice(deviceName);
          setError(null);
        }
      } catch (e: unknown) {
        if (requestId !== latestGetPageRequestId.current) {
          return;
        }

        latestPendingDevice.current = null;

        const errorMessage = toErrorMessage(e);

        // Use shared Ledger error mapping (hw-wallet-sdk) when connecting to Ledger.
        if (deviceName === HardwareDeviceNames.ledger) {
          const hwError = toHardwareWalletError(e, HardwareWalletType.Ledger);

          if (
            hwError.code !== ErrorCode.Unknown &&
            hwError.code !== ErrorCode.ConnectionClosed
          ) {
            setError(hwError.userMessage);
            return;
          }
        }

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
      setCurrentDevice,
      showTemporaryAlert,
      t,
      unlocked,
    ],
  );

  useEffect(() => {
    if (/Firefox/u.test(window.navigator.userAgent)) {
      setIsFirefox(true);
    }
  }, []);

  useEffect(() => {
    const previousScanRequest = previousActiveQrCodeScanRequest.current;

    if (
      previousScanRequest?.type === QrScanRequestType.PAIR &&
      !activeQrCodeScanRequest &&
      latestHardwareAccounts.current.length === 0 &&
      !latestDevice.current &&
      !latestPendingDevice.current
    ) {
      const hdPath = defaultHdPaths[HardwareDeviceNames.qr];

      dispatch(actions.checkHardwareStatus(HardwareDeviceNames.qr, hdPath))
        .then((isUnlocked) => {
          if (
            isUnlocked &&
            latestHardwareAccounts.current.length === 0 &&
            !latestDevice.current &&
            !latestPendingDevice.current
          ) {
            setCurrentDevice(HardwareDeviceNames.qr);
            getPage(HardwareDeviceNames.qr, 0, hdPath).catch(() => undefined);
          }
        })
        .catch((errorResponse: unknown) => {
          setError(toErrorMessage(errorResponse));
        });
    }

    previousActiveQrCodeScanRequest.current = activeQrCodeScanRequest;
  }, [
    activeQrCodeScanRequest,
    defaultHdPaths,
    dispatch,
    getPage,
    setCurrentDevice,
  ]);

  const connectToHardwareWallet = useCallback(
    (nextDevice: string) => {
      if (latestPendingDevice.current === nextDevice) {
        return;
      }

      setCurrentDevice(nextDevice);
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
      setCurrentDevice,
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
        latestGetPageRequestId.current += 1;
        latestPendingDevice.current = null;
        latestHardwareAccounts.current = [];
        setHardwareAccounts([]);
        setCurrentDevice(null);
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
    [dispatch, setCurrentDevice, trackEvent],
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

      const selectedAccountIndexes = selectedAccounts
        .filter(
          (accountIndex) =>
            Number.isInteger(Number(accountIndex)) && Number(accountIndex) >= 0,
        )
        .map(Number);
      if (selectedAccountIndexes.length !== selectedAccounts.length) {
        setError(t('accountSelectionRequired'));
        return;
      }

      try {
        await dispatch(
          actions.unlockHardwareWalletAccounts(
            selectedAccountIndexes,
            deviceName as HardwareDeviceNames,
            path || null,
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
            <Box marginHorizontal={5} marginBottom={2}>
              <Text color={TextColor.WarningDefault}>
                {t('troubleConnectingToLedgerU2FOnFirefox', [
                  <TextButton key="u2f-error-1" asChild className="inline">
                    <a
                      href={ZENDESK_URLS.HARDWARE_CONNECTION}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('troubleConnectingToLedgerU2FOnFirefox2')}
                    </a>
                  </TextButton>,
                ])}
              </Text>
            </Box>
            <Box marginHorizontal={5} marginBottom={2}>
              <Text color={TextColor.WarningDefault}>
                {t('troubleConnectingToLedgerU2FOnFirefoxLedgerSolution', [
                  <TextButton key="u2f-error-2" asChild className="inline">
                    <a
                      href={ZENDESK_URLS.LEDGER_FIREFOX_U2F_GUIDE}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t(
                        'troubleConnectingToLedgerU2FOnFirefoxLedgerSolution2',
                      )}
                    </a>
                  </TextButton>,
                ])}
              </Text>
            </Box>
          </>
        );
      }
      return (
        <Box marginHorizontal={5} marginBottom={2}>
          <Text color={TextColor.WarningDefault}>
            {t('troubleConnectingToWallet', [
              device,
              <TextButton key="u2f-error-1" asChild className="inline">
                <a
                  href={ZENDESK_URLS.HARDWARE_CONNECTION}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('walletConnectionGuide')}
                </a>
              </TextButton>,
            ])}
          </Text>
        </Box>
      );
    }
    return error ? (
      <Text color={TextColor.ErrorDefault} className="hw-connect__error">
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
          ledgerTransportType={ledgerTransportType}
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
