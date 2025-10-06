import { TransactionType } from '@metamask/transaction-controller';
import React from 'react';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../../components/component-library';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { getAvatarNetworkColor } from '../../../../../helpers/utils/accounts';
import useConfirmationNetworkInfo from '../../../hooks/useConfirmationNetworkInfo';
import useConfirmationRecipientInfo from '../../../hooks/useConfirmationRecipientInfo';
import { useUnapprovedTransaction } from '../../../hooks/transactions/useUnapprovedTransaction';
import { DAppInitiatedHeader } from './dapp-initiated-header';
import HeaderInfo from './header-info';
import { WalletInitiatedHeader } from './wallet-initiated-header';

const TRANSACTION_TYPES_NEW_HEADER: TransactionType[] = [
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
  TransactionType.simpleSend,
];

const Header = () => {
  const { networkImageUrl, networkDisplayName } = useConfirmationNetworkInfo();
  const {
    senderAddress: fromAddress,
    senderName: fromName,
    walletName,
    isBIP44,
    hasMoreThanOneWallet,
  } = useConfirmationRecipientInfo();

  const transactionMeta = useUnapprovedTransaction();
  let secondaryText;

  if (isBIP44) {
    if (hasMoreThanOneWallet) {
      secondaryText = walletName;
    }
  } else {
    secondaryText = networkDisplayName;
  }

  const DefaultHeader = (
    <Box
      display={Display.Flex}
      className="confirm_header__wrapper"
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      data-testid="confirm-header"
    >
      <Box alignItems={AlignItems.flexStart} display={Display.Flex} padding={4}>
        <Box display={Display.Flex} marginTop={2}>
          <PreferredAvatar address={fromAddress} />
          {!isBIP44 && (
            <AvatarNetwork
              src={networkImageUrl}
              name={networkDisplayName}
              size={AvatarNetworkSize.Xs}
              backgroundColor={getAvatarNetworkColor(networkDisplayName)}
              className="confirm_header__avatar-network"
            />
          )}
        </Box>
        <Box marginInlineStart={4} marginTop={secondaryText ? 0 : 3}>
          <Text
            color={TextColor.textDefault}
            variant={TextVariant.bodyMdMedium}
            data-testid="header-account-name"
          >
            {fromName}
          </Text>
          {secondaryText && (
            <Text
              color={TextColor.textAlternative}
              data-testid="header-network-display-name"
            >
              {secondaryText}
            </Text>
          )}
        </Box>
      </Box>
      <Box alignItems={AlignItems.flexEnd} display={Display.Flex} padding={4}>
        <HeaderInfo />
      </Box>
    </Box>
  );

  // The new header includes only a heading, the advanced details toggle, and a
  // back button if it's a wallet initiated confirmation. The default header is
  // the original header for the redesigns and includes the sender and recipient
  // addresses as well.
  const isTransactionWithNewHeader =
    transactionMeta?.type &&
    TRANSACTION_TYPES_NEW_HEADER.includes(transactionMeta.type);

  const isWalletInitiated = transactionMeta?.origin === ORIGIN_METAMASK;

  if (isTransactionWithNewHeader && isWalletInitiated) {
    return <WalletInitiatedHeader />;
  }

  if (isTransactionWithNewHeader && !isWalletInitiated) {
    return <DAppInitiatedHeader />;
  }

  return DefaultHeader;
};

export default Header;
