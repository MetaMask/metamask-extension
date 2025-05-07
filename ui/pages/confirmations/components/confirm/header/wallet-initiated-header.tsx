import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
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
import { SEND_ROUTE } from '../../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { showSendTokenPage } from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { AdvancedDetailsButton } from './advanced-details-button';

export const WalletInitiatedHeader = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const handleBackButtonClick = useCallback(async () => {
    const { id } = currentConfirmation;

    const isNativeSend =
      currentConfirmation.type === TransactionType.simpleSend;
    const isERC20TokenSend =
      currentConfirmation.type === TransactionType.tokenMethodTransfer;
    const isNFTTokenSend =
      currentConfirmation.type === TransactionType.tokenMethodTransferFrom ||
      currentConfirmation.type === TransactionType.tokenMethodSafeTransferFrom;

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

    history.push(SEND_ROUTE);
  }, [currentConfirmation, dispatch, history]);

  return (
    <Box
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      padding={3}
      style={{ zIndex: 2 }}
    >
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        ariaLabel={t('back')}
        size={ButtonIconSize.Md}
        onClick={handleBackButtonClick}
        data-testid="wallet-initiated-header-back-button"
        color={IconColor.iconDefault}
      />
      <Text variant={TextVariant.headingMd} color={TextColor.inherit}>
        {t('review')}
      </Text>
      <AdvancedDetailsButton />
    </Box>
  );
};
