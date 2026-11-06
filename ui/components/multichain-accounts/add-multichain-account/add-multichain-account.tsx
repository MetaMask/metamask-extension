import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountWalletId } from '@metamask/account-api';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { createNextMultichainAccountGroup } from '../../../store/actions';
import { useAccountsOperationsLoadingStates } from '../../../hooks/accounts/useAccountsOperationsLoadingStates';
import { useDispatch } from '../../../store/hooks';
import { CONNECT_HARDWARE_ROUTE } from '../../../helpers/constants/routes';
import { HardwareDeviceNames } from '../../../../shared/constants/hardware-wallets';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';

import {
  endTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../../shared/lib/trace';

export type AddMultichainAccountProps = {
  walletId: AccountWalletId;
  /**
   * When set, the button opens the account selector for this hardware device
   * instead of creating the next account of the wallet.
   */
  hardwareDevice?: HardwareDeviceNames;
};

export const AddMultichainAccount = ({
  walletId,
  hardwareDevice,
}: AddMultichainAccountProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    isAccountTreeSyncingInProgress: isSyncing,
    loadingMessage: accountOperationLoadingMessage,
  } = useAccountsOperationsLoadingStates();
  // Account tree syncing only affects HD wallets.
  const isAccountTreeSyncingInProgress = !hardwareDevice && isSyncing;

  const isLoadingState = isLoading || isAccountTreeSyncingInProgress;

  const actionLabel = useMemo(() => {
    if (isAccountTreeSyncingInProgress) {
      return accountOperationLoadingMessage;
    }

    if (isLoadingState) {
      return t('createMultichainAccountButtonLoading');
    }

    return t('createMultichainAccountButton');
  }, [
    isLoadingState,
    accountOperationLoadingMessage,
    isAccountTreeSyncingInProgress,
    t,
  ]);

  const handleConnectHardwareWalletClick = () => {
    const query = `device=${hardwareDevice}`;
    const environmentType = getEnvironmentType();

    // Same as the "Add wallet" flow, hardware wallets are connected from an
    // expanded tab as the popup and side panel cannot prompt for devices.
    if (
      environmentType === ENVIRONMENT_TYPE_POPUP ||
      environmentType === ENVIRONMENT_TYPE_SIDEPANEL
    ) {
      globalThis.platform.openExtensionInBrowser?.(
        CONNECT_HARDWARE_ROUTE,
        query,
        environmentType === ENVIRONMENT_TYPE_SIDEPANEL,
      );
      return;
    }

    navigate(`${CONNECT_HARDWARE_ROUTE}?${query}`);
  };

  const handleCreateMultichainAccountClick = async () => {
    if (isLoadingState) {
      return;
    }

    if (hardwareDevice) {
      handleConnectHardwareWalletClick();
      return;
    }

    try {
      trace({
        name: TraceName.CreateMultichainAccount,
        op: TraceOperation.AccountCreate,
      });

      setIsLoading(true);
      await dispatch(createNextMultichainAccountGroup(walletId));
    } finally {
      setIsLoading(false);
      endTrace({
        name: TraceName.CreateMultichainAccount,
      });
    }
  };

  return (
    <Box
      className="add-multichain-account"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Start}
      style={{
        cursor: isLoadingState ? 'not-allowed' : 'pointer',
      }}
      padding={4}
      onClick={handleCreateMultichainAccountClick}
      data-testid={
        hardwareDevice
          ? 'add-hardware-wallet-account-button'
          : 'add-multichain-account-button'
      }
      key={`add-multichain-account-button-${walletId}`}
    >
      <Box
        className="add-multichain-account__icon-box ml-1 mr-4 rounded-md"
        data-testid="add-multichain-account-icon-box"
        backgroundColor={
          isLoadingState
            ? BoxBackgroundColor.Transparent
            : BoxBackgroundColor.InfoMuted
        }
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
      >
        {!isLoadingState && (
          <Icon
            className="add-multichain-account__icon-box__icon"
            name={IconName.Add}
            color={IconColor.InfoDefault}
            size={IconSize.Lg}
          />
        )}
        {isLoadingState && (
          <Icon
            className="add-multichain-account__icon-box__icon-loading"
            name={IconName.Loading}
            color={IconColor.IconMuted}
            size={IconSize.Lg}
          />
        )}
      </Box>
      <Text
        className="add-multichain-account__text"
        color={isLoadingState ? TextColor.TextMuted : TextColor.InfoDefault}
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
      >
        {actionLabel}
      </Text>
    </Box>
  );
};
