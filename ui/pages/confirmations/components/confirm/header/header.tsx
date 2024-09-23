import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../../components/component-library';
import Identicon from '../../../../../components/ui/identicon';
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
import { getAvatarNetworkColor } from '../../../../../helpers/utils/accounts';
import useConfirmationNetworkInfo from '../../../hooks/useConfirmationNetworkInfo';
import useConfirmationRecipientInfo from '../../../hooks/useConfirmationRecipientInfo';
import HeaderInfo from './header-info';
import { useConfirmContext } from '../../../context/confirm';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Confirmation } from '../../../types/confirm';
import { useDispatch, useSelector } from 'react-redux';
import { editExistingTransaction } from '../../../../../ducks/send';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { clearConfirmTransaction } from '../../../../../ducks/confirm-transaction/confirm-transaction.duck';
import {
  setConfirmationAdvancedDetailsOpen,
  showSendTokenPage,
} from '../../../../../store/actions';
import { SEND_ROUTE } from '../../../../../helpers/constants/routes';
import { useHistory } from 'react-router-dom';
import { selectConfirmationAdvancedDetailsOpen } from '../../../selectors/preferences';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

const Header = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const { networkImageUrl, networkDisplayName } = useConfirmationNetworkInfo();
  const { senderAddress: fromAddress, senderName: fromName } =
    useConfirmationRecipientInfo();

  const { currentConfirmation } = useConfirmContext<Confirmation>();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const setShowAdvancedDetails = (value: boolean): void => {
    dispatch(setConfirmationAdvancedDetailsOpen(value));
  };

  if (currentConfirmation.type === TransactionType.tokenMethodTransfer) {
    const isWalletInitiated =
      (currentConfirmation as TransactionMeta).origin === 'metamask';

    if (isWalletInitiated) {
      const onClickBackHandler = () => {
        const handleEditTransaction = async ({
          txData,
        }: {
          txData: TransactionMeta;
        }) => {
          const { id } = txData;
          await dispatch(
            editExistingTransaction(AssetType.token, id.toString()),
          );
          dispatch(clearConfirmTransaction());
          dispatch(showSendTokenPage());
        };

        handleEditTransaction({
          txData: currentConfirmation as TransactionMeta,
        }).then(() => history.push(SEND_ROUTE));
      };

      const WalletInitiatedHeading = (
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
            onClick={onClickBackHandler}
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

      return WalletInitiatedHeading;
    }
  }

  return (
    <Box
      display={Display.Flex}
      className="confirm_header__wrapper"
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      data-testid="confirm-header"
    >
      <Box alignItems={AlignItems.flexStart} display={Display.Flex} padding={4}>
        <Box display={Display.Flex} marginTop={2}>
          <Identicon address={fromAddress} diameter={32} />
          <AvatarNetwork
            src={networkImageUrl}
            name={networkDisplayName}
            size={AvatarNetworkSize.Xs}
            backgroundColor={getAvatarNetworkColor(networkDisplayName)}
            className="confirm_header__avatar-network"
          />
        </Box>
        <Box marginInlineStart={4}>
          <Text
            color={TextColor.textDefault}
            variant={TextVariant.bodyMdMedium}
            data-testid="header-account-name"
          >
            {fromName}
          </Text>
          <Text
            color={TextColor.textAlternative}
            data-testid="header-network-display-name"
          >
            {networkDisplayName}
          </Text>
        </Box>
      </Box>
      <Box alignItems={AlignItems.flexEnd} display={Display.Flex} padding={4}>
        <HeaderInfo />
      </Box>
    </Box>
  );
};

export default Header;
