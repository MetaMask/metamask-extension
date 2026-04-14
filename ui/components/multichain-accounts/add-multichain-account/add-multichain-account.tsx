import React, { useMemo, useState } from 'react';
import { AccountWalletId } from '@metamask/account-api';
import { useDispatch } from 'react-redux';
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
import {
  endTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../../shared/lib/trace';

export type AddMultichainAccountProps = {
  walletId: AccountWalletId;
};

export const AddMultichainAccount = ({
  walletId,
}: AddMultichainAccountProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const {
    isAccountTreeSyncingInProgress,
    loadingMessage: accountOperationLoadingMessage,
  } = useAccountsOperationsLoadingStates();

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

  const handleCreateMultichainAccountClick = async () => {
    if (isLoadingState) {
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
      data-testid={`add-multichain-account-button`}
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
