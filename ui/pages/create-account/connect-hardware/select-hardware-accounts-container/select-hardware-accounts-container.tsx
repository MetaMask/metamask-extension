import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { upperFirst } from 'lodash';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SelectHardwareAccountsPage } from '../select-hardware-accounts-page';
import { SelectHdPathPage } from '../select-hd-path-page';
import {
  mapAccountIdsToIndices,
  mapHardwareAccountsToWalletAccounts,
  mapIndicesToAccountIds,
} from '../utils/map-hardware-accounts';
import type {
  HardwareAccountsFlowView,
  SelectHardwareAccountsContainerProps,
} from './select-hardware-accounts-container.types';

/**
 * Wires the redesigned hardware wallet account selector and HD path pages
 * to the existing connect-hardware background flow.
 *
 * @param options - Container props.
 * @param options.device - Connected hardware device name.
 * @param options.accounts - Raw accounts returned from connectHardware.
 * @param options.connectedAccounts - Lowercase addresses already imported in MetaMask.
 * @param options.selectedAccountIndices - Selected hardware account indices.
 * @param options.onSelectedAccountIndicesChange - Called when the user changes account selection.
 * @param options.selectedPath - Currently selected HD derivation path.
 * @param options.hdPaths - Available HD path options for the device.
 * @param options.showHdPathSettings - Whether the HD path settings button is shown.
 * @param options.onPathChange - Called when the user selects a different HD path.
 * @param options.onBack - Called when the user leaves the account selector.
 * @param options.onShowMore - Called when the user requests more accounts.
 * @param options.onContinue - Called when the user confirms account selection.
 * @param options.onForgetDevice - Called when the user disconnects the device.
 * @param options.hasMoreAccounts - Whether additional accounts can be loaded.
 * @param options.isLoadingMore - Whether a load-more request is in progress.
 */
export const SelectHardwareAccountsContainer = ({
  device,
  accounts,
  connectedAccounts,
  selectedAccountIndices,
  onSelectedAccountIndicesChange,
  selectedPath,
  hdPaths,
  showHdPathSettings,
  onPathChange,
  onBack,
  onShowMore,
  onContinue,
  onForgetDevice,
  hasMoreAccounts,
  isLoadingMore,
}: SelectHardwareAccountsContainerProps) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const initialDeviceRef = useRef(device);
  const [view, setView] = useState<HardwareAccountsFlowView>('accounts');
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.ConnectHardwareWalletAccountSelectorViewed,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        device_type: upperFirst(initialDeviceRef.current),
      },
    });
  }, [trackEvent]);

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

  const handleAccountSelectionChange = useCallback(
    (nextSelectedAccountIds: string[]) => {
      onSelectedAccountIndicesChange(
        mapAccountIdsToIndices(nextSelectedAccountIds),
      );
    },
    [onSelectedAccountIndicesChange],
  );

  const handleContinue = useCallback(async () => {
    if (isContinuing) {
      return;
    }

    setIsContinuing(true);
    try {
      await onContinue();
    } finally {
      setIsContinuing(false);
    }
  }, [isContinuing, onContinue]);

  const handleSettingsClick = useCallback(() => {
    setView('hd-path');
  }, []);

  const handleHdPathBack = useCallback(() => {
    setView('accounts');
  }, []);

  const handleHdPathChange = useCallback(
    (path: string) => {
      if (path !== selectedPath) {
        onPathChange(path);
      }
      setView('accounts');
    },
    [onPathChange, selectedPath],
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
    <SelectHardwareAccountsPage
      accounts={walletAccounts}
      selectedAccountIds={selectedAccountIds}
      onAccountSelectionChange={handleAccountSelectionChange}
      onBack={onBack}
      onShowMore={onShowMore}
      onContinue={handleContinue}
      onForgetDevice={onForgetDevice}
      hasMoreAccounts={hasMoreAccounts}
      isLoadingMore={isLoadingMore}
      isContinuing={isContinuing}
      onSettingsClick={showHdPathSettings ? handleSettingsClick : undefined}
      showSettingsButton={showHdPathSettings}
    />
  );
};
