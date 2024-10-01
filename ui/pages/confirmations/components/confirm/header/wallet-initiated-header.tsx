import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { SEND_ROUTE } from '../../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  setConfirmationAdvancedDetailsOpen,
  showSendTokenPage,
} from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { selectConfirmationAdvancedDetailsOpen } from '../../../selectors/preferences';

export const WalletInitiatedHeader = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const setShowAdvancedDetails = (value: boolean): void => {
    dispatch(setConfirmationAdvancedDetailsOpen(value));
  };

  const handleBackButtonClick = useCallback(async () => {
    const { id } = currentConfirmation;

    await dispatch(editExistingTransaction(AssetType.token, id.toString()));
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
      <Box
        backgroundColor={
          showAdvancedDetails
            ? BackgroundColor.infoMuted
            : BackgroundColor.transparent
        }
        borderRadius={BorderRadius.MD}
        marginRight={1}
      >
        <ButtonIcon
          ariaLabel="Advanced tx details"
          color={IconColor.iconDefault}
          iconName={IconName.Customize}
          data-testid="header-advanced-details-button"
          size={ButtonIconSize.Md}
          onClick={() => {
            setShowAdvancedDetails(!showAdvancedDetails);
          }}
        />
      </Box>
    </Box>
  );
};
