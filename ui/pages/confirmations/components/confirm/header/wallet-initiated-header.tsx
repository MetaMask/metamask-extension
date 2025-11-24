import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import { AssetType } from '../../../../../../shared/constants/transaction';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../../components/component-library';
import { clearConfirmTransaction } from '../../../../../ducks/confirm-transaction/confirm-transaction.duck';
import { editExistingTransaction } from '../../../../../ducks/send';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { SHIELD_PLAN_ROUTE } from '../../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { showSendTokenPage } from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import { useRedesignedSendFlow } from '../../../hooks/useRedesignedSendFlow';
import { navigateToSendRoute } from '../../../utils/send';
import { AdvancedDetailsButton } from './advanced-details-button';

export const WalletInitiatedHeader = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { enabled: isSendRedesignEnabled } = useRedesignedSendFlow();
  const { onCancel } = useConfirmActions();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const navigate = useNavigate();

  const handleBackButtonClick = useCallback(async () => {
    if (
      currentConfirmation.type === TransactionType.shieldSubscriptionApprove
    ) {
      onCancel({ location: MetaMetricsEventLocation.Confirmation });
      navigate(SHIELD_PLAN_ROUTE);
      return;
    }

    const { id } = currentConfirmation;

    const isNativeSend =
      currentConfirmation.type === TransactionType.simpleSend;
    const isERC20TokenSend =
      currentConfirmation.type === TransactionType.tokenMethodTransfer;
    const isNFTTokenSend =
      currentConfirmation.type === TransactionType.tokenMethodTransferFrom ||
      currentConfirmation.type === TransactionType.tokenMethodSafeTransferFrom;

    if (
      isSendRedesignEnabled &&
      (isNativeSend || isERC20TokenSend || isNFTTokenSend)
    ) {
      onCancel({
        location: MetaMetricsEventLocation.Confirmation,
        navigateBackForSend: true,
      });
      return;
    }

    let assetType: AssetType;
    if (isNativeSend) {
      assetType = AssetType.native;
    } else if (isERC20TokenSend) {
      assetType = AssetType.token;
    } else if (isNFTTokenSend) {
      assetType = AssetType.NFT;
    } else {
      assetType = AssetType.unknown;
    }

    await dispatch(editExistingTransaction(assetType, id.toString()));
    dispatch(clearConfirmTransaction());
    dispatch(showSendTokenPage());
    navigateToSendRoute(navigate, isSendRedesignEnabled);
  }, [
    currentConfirmation,
    dispatch,
    isSendRedesignEnabled,
    navigate,
    onCancel,
  ]);

  return (
    <Box
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      paddingInline={3}
      paddingTop={4}
      paddingBottom={4}
      style={{ zIndex: 2 }}
    >
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        ariaLabel={t('back')}
        size={ButtonIconSize.Md}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={handleBackButtonClick}
        data-testid="wallet-initiated-header-back-button"
        color={IconColor.iconDefault}
      />
      <Text variant={TextVariant.headingSm} color={TextColor.inherit}>
        {currentConfirmation.type === TransactionType.shieldSubscriptionApprove
          ? t('shieldConfirmMembership')
          : t('review')}
      </Text>
      <AdvancedDetailsButton />
    </Box>
  );
};
