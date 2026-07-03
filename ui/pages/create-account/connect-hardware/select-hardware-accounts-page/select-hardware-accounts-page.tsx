/* eslint-disable @typescript-eslint/naming-convention */
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { upperFirst } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { KeyringObject } from '@metamask/keyring-controller';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import * as actions from '../../../../store/actions';
import { getErrorMessage as toErrorMessage } from '../../../../../shared/lib/error';
import {
  DEVICE_KEYRING_MAP,
  HardwareDeviceNames,
  MEW_PATH,
} from '../../../../../shared/constants/hardware-wallets';
import { KeyringType } from '../../../../../shared/constants/keyring';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { getHDEntropyIndex } from '../../../../selectors/selectors';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import type { MetaMaskReduxDispatch } from '../../../../store/store';
import { Footer, Page } from '../../../../components/multichain/pages/page';
import { HardwareAccountCard } from '../../../../components/multichain-accounts/hardware-account-card';
import { SelectHdPathPage } from '../select-hd-path-page';
import {
  getDeviceHdPaths,
  shouldShowHdPathSettings,
} from '../utils/hardware-hd-paths';
import {
  mapAccountIdsToIndices,
  mapHardwareAccountsToWalletAccounts,
  mapIndicesToAccountIds,
} from '../utils/map-hardware-accounts';
import type { HardwareConnectAccount, RawHardwareAccount } from '../types';
import type {
  HardwareAccountsPageView,
  SelectHardwareAccountsPageProps,
} from './select-hardware-accounts-page.types';

const ACCOUNTS_PER_PAGE = 5;

function toRawAccounts(accounts: HardwareConnectAccount[]): RawHardwareAccount[] {
  return accounts.map(({ address, index }) => ({ address, index }));
}

/**
 * Entry point for selecting hardware wallet accounts to import.
 * Handles account pagination, HD path changes, unlock, and forget-device actions.
 *
 * @param options - Page props.
 * @param options.device - Connected hardware device name.
 * @param options.accounts - Accounts returned from the initial connectHardware call.
 * @param options.connectedAccounts - Lowercase addresses already imported in MetaMask.
 * @param options.onBack - Called when the user leaves the account selector.
 * @param options.onError - Called when an error should be shown by the parent.
 */
export const SelectHardwareAccountsPage = ({
  device,
  accounts: initialAccounts,
  connectedAccounts,
  onBack,
  onError,
}: SelectHardwareAccountsPageProps) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const dispatch: MetaMaskReduxDispatch = useDispatch();
  const navigate = useNavigate();
  const initialDeviceRef = useRef(device);
  const latestFetchRequestId = useRef(0);

  const defaultHdPaths = useSelector(
    (state: { appState: { defaultHdPaths: Record<string, string> } }) =>
      state.appState.defaultHdPaths,
  );
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const keyrings = useSelector(
    (state: { metamask: { keyrings: KeyringObject[] } }) =>
      state.metamask.keyrings,
  );

  const selectedPath = defaultHdPaths[device];
  const hdPaths = getDeviceHdPaths(device);
  const showHdPathSettings = shouldShowHdPathSettings(device);

  const [view, setView] = useState<HardwareAccountsPageView>('accounts');
  const [accounts, setAccounts] = useState<RawHardwareAccount[]>(() =>
    toRawAccounts(initialAccounts),
  );
  const [selectedAccountIndices, setSelectedAccountIndices] = useState<
    number[]
  >([]);
  const [lastFetchedBatchSize, setLastFetchedBatchSize] = useState(
    initialAccounts.length,
  );
  const [isLoadingMoreAccounts, setIsLoadingMoreAccounts] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

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

  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.ConnectHardwareWalletAccountSelectorViewed,
      properties: {
        device_type: upperFirst(initialDeviceRef.current),
      },
    });
  }, [trackEvent]);

  const fetchAccounts = useCallback(
    async (page: number, hdPath: string, options?: { append?: boolean }) => {
      const requestId = latestFetchRequestId.current + 1;
      latestFetchRequestId.current = requestId;

      try {
        const nextAccounts = (await dispatch(
          actions.connectHardware(
            device as HardwareDeviceNames,
            page as unknown as string,
            hdPath,
            false,
            t as (key: string) => string,
          ),
        )) as { address: string; index?: number }[];

        if (requestId !== latestFetchRequestId.current) {
          return;
        }

        const mappedAccounts: RawHardwareAccount[] = nextAccounts.map(
          (account, idx) => ({
            address: account.address,
            index: account.index ?? idx,
          }),
        );

        setLastFetchedBatchSize(mappedAccounts.length);

        if (options?.append) {
          if (mappedAccounts.length > 0) {
            setAccounts((previousAccounts) => {
              const existingIndices = new Set(
                previousAccounts.map((account) => account.index),
              );
              const uniqueNewAccounts = mappedAccounts.filter(
                (account) => !existingIndices.has(account.index),
              );

              return [...previousAccounts, ...uniqueNewAccounts];
            });
          } else {
            setLastFetchedBatchSize(0);
          }
        } else if (mappedAccounts.length > 0) {
          setAccounts(mappedAccounts);
        }

        onError(null);
      } catch (error: unknown) {
        if (requestId !== latestFetchRequestId.current) {
          return;
        }

        onError(toErrorMessage(error));
      }
    },
    [device, dispatch, onError, t],
  );

  const handlePathChange = useCallback(
    (path: string) => {
      if (path === selectedPath) {
        return;
      }

      dispatch(
        actions.setHardwareWalletDefaultHdPath({
          device: device as HardwareDeviceNames,
          path,
        }),
      );
      setSelectedAccountIndices([]);
      setLastFetchedBatchSize(0);
      setIsLoadingMoreAccounts(false);
      fetchAccounts(0, path);
    },
    [device, dispatch, fetchAccounts, selectedPath],
  );

  const handleShowMore = useCallback(async () => {
    if (isLoadingMoreAccounts) {
      return;
    }

    if (lastFetchedBatchSize < ACCOUNTS_PER_PAGE) {
      onError(t('ledgerAccountRestriction') as string);
      return;
    }

    setIsLoadingMoreAccounts(true);
    try {
      await fetchAccounts(1, selectedPath, { append: true });
    } finally {
      setIsLoadingMoreAccounts(false);
    }
  }, [
    fetchAccounts,
    isLoadingMoreAccounts,
    lastFetchedBatchSize,
    onError,
    selectedPath,
    t,
  ]);

  const handleContinue = useCallback(async () => {
    if (isContinuing) {
      return;
    }

    if (selectedAccountIndices.length === 0) {
      onError(t('accountSelectionRequired') as string);
      return;
    }

    const description =
      MEW_PATH === selectedPath
        ? (t('hardwareWalletLegacyDescription') as string)
        : '';

    const selectedAccountIndexes = selectedAccountIndices
      .filter(
        (accountIndex) =>
          Number.isInteger(Number(accountIndex)) && Number(accountIndex) >= 0,
      )
      .map(Number);

    if (selectedAccountIndexes.length !== selectedAccountIndices.length) {
      onError(t('accountSelectionRequired') as string);
      return;
    }

    setIsContinuing(true);
    try {
      await dispatch(
        actions.unlockHardwareWalletAccounts(
          selectedAccountIndexes,
          device as HardwareDeviceNames,
          selectedPath || null,
          description,
        ),
      );

      trackEvent({
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAdded,
        properties: {
          account_type: MetaMetricsEventAccountType.Hardware,
          account_hardware_type: device,
          is_suggested_name: true,
        },
      });

      const deviceCount = hardwareWalletKeyrings.length;
      const isAlreadyConnected = hardwareWalletKeyrings.some(
        (keyring) =>
          keyring.type ===
          DEVICE_KEYRING_MAP[device as keyof typeof DEVICE_KEYRING_MAP],
      );

      trackEvent({
        event: MetaMetricsEventName.HardwareWalletAccountConnected,
        properties: {
          device_type: upperFirst(device),
          hd_path: selectedPath,
          connected_device_count: isAlreadyConnected
            ? deviceCount
            : deviceCount + 1,
        },
      });

      navigate(DEFAULT_ROUTE);
    } catch (error: unknown) {
      const errorMessage = toErrorMessage(error);

      trackEvent({
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.AccountAddFailed,
        properties: {
          account_type: MetaMetricsEventAccountType.Hardware,
          account_hardware_type: device,
          error: errorMessage,
          hd_entropy_index: hdEntropyIndex,
        },
      });

      trackEvent({
        event: MetaMetricsEventName.HardwareWalletConnectionFailed,
        properties: {
          hd_path: selectedPath,
          device_type: upperFirst(device),
          error: errorMessage,
        },
      });

      onError(errorMessage);
    } finally {
      setIsContinuing(false);
    }
  }, [
    device,
    dispatch,
    hardwareWalletKeyrings,
    hdEntropyIndex,
    isContinuing,
    navigate,
    onError,
    selectedAccountIndices,
    selectedPath,
    t,
    trackEvent,
  ]);

  const handleForgetDevice = useCallback(async () => {
    try {
      await dispatch(actions.forgetDevice(device as HardwareDeviceNames));

      trackEvent({
        event: MetaMetricsEventName.HardwareWalletForgotten,
        properties: {
          device_type: upperFirst(device),
        },
      });

      onBack();
    } catch (error: unknown) {
      const errorMessage = toErrorMessage(error);

      trackEvent({
        event: MetaMetricsEventName.HardwareWalletConnectionFailed,
        properties: {
          hd_path: selectedPath,
          device_type: upperFirst(device),
          error: errorMessage,
        },
      });

      onError(errorMessage);
    }
  }, [device, dispatch, onBack, onError, selectedPath, trackEvent]);

  const handleSettingsClick = useCallback(() => {
    setView('hd-path');
  }, []);

  const handleHdPathBack = useCallback(() => {
    setView('accounts');
  }, []);

  const handleHdPathChange = useCallback(
    (path: string) => {
      handlePathChange(path);
      setView('accounts');
    },
    [handlePathChange],
  );

  const walletAccounts = useMemo(
    () =>
      mapHardwareAccountsToWalletAccounts(
        accounts,
        connectedAccounts,
        t('networkNameEthereum') as string,
      ),
    [accounts, connectedAccounts, t],
  );

  const selectedAccountIds = useMemo(
    () => mapIndicesToAccountIds(selectedAccountIndices),
    [selectedAccountIndices],
  );

  const handleToggleSelection = useCallback(
    (accountId: string) => {
      const isSelected = selectedAccountIds.includes(accountId);
      const nextSelectedAccountIds = isSelected
        ? selectedAccountIds.filter((id) => id !== accountId)
        : [...selectedAccountIds, accountId];

      setSelectedAccountIndices(mapAccountIdsToIndices(nextSelectedAccountIds));
      onError(null);
    },
    [onError, selectedAccountIds],
  );

  const isContinueDisabled = selectedAccountIds.length === 0 || isContinuing;
  const hasMoreAccounts = lastFetchedBatchSize === ACCOUNTS_PER_PAGE;

  const accountCards = useMemo(
    () =>
      walletAccounts.map((account) => (
        <HardwareAccountCard
          key={account.id}
          account={account}
          isSelected={selectedAccountIds.includes(account.id)}
          onToggleSelection={handleToggleSelection}
        />
      )),
    [handleToggleSelection, selectedAccountIds, walletAccounts],
  );

  if (view === 'hd-path' && showHdPathSettings) {
    return (
      <SelectHdPathPage
        hdPaths={hdPaths}
        selectedPath={selectedPath}
        onPathChange={handleHdPathChange}
        onBack={handleHdPathBack}
      />
    );
  }

  return (
    <Page className="mx-auto h-full min-h-0 w-full max-w-[460px] overflow-hidden sm:max-w-[520px]">
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        className="min-h-14 shrink-0 px-1 py-2"
      >
        <ButtonIcon
          size={ButtonIconSize.Md}
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back') as string}
          onClick={onBack}
          data-testid="select-hardware-accounts-page-back-button"
        />
        {showHdPathSettings ? (
          <ButtonIcon
            size={ButtonIconSize.Md}
            iconName={IconName.Setting}
            ariaLabel={t('settings') as string}
            onClick={handleSettingsClick}
            data-testid="select-hardware-accounts-page-settings-button"
          />
        ) : (
          <Box className="w-10 shrink-0" />
        )}
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="min-h-0 w-full flex-1 gap-6 overflow-hidden px-4 pb-4"
      >
        <Text
          variant={TextVariant.HeadingLg}
          className="shrink-0 md:text-s-heading-lg md:leading-s-heading-lg md:tracking-s-heading-lg"
          data-testid="select-hardware-accounts-page-title"
        >
          {t('selectAnAccount')}
        </Text>
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={3}
          className="min-h-0 w-full flex-1 overflow-y-auto"
          data-testid="select-hardware-accounts-page-accounts-scroll"
        >
          {accountCards}
          {hasMoreAccounts ? (
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              isFullWidth
              isLoading={isLoadingMoreAccounts}
              onClick={handleShowMore}
              data-testid="select-hardware-accounts-page-show-more-button"
            >
              {t('showMore')}
            </Button>
          ) : null}
        </Box>
      </Box>
      <Footer className="shrink-0">
        <Box flexDirection={BoxFlexDirection.Row} gap={4} className="w-full">
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={handleForgetDevice}
            data-testid="select-hardware-accounts-page-forget-device-button"
          >
            {t('forgetDevice')}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
            isDisabled={isContinueDisabled}
            isLoading={isContinuing}
            onClick={handleContinue}
            data-testid="select-hardware-accounts-page-continue-button"
          >
            {t('continue')}
          </Button>
        </Box>
      </Footer>
    </Page>
  );
};
