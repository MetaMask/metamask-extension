import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../../components/component-library';
import Identicon from '../../../../../components/ui/identicon';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { getAvatarNetworkColor } from '../../../../../helpers/utils/accounts';
import { useConfirmContext } from '../../../context/confirm';
import useConfirmationNetworkInfo from '../../../hooks/useConfirmationNetworkInfo';
import useConfirmationRecipientInfo from '../../../hooks/useConfirmationRecipientInfo';
import { Confirmation } from '../../../types/confirm';
import { DAppInitiatedHeader } from './dapp-initiated-header';
import HeaderInfo from './header-info';
import { WalletInitiatedHeader } from './wallet-initiated-header';

const CONFIRMATIONS_WITH_NEW_HEADER = [
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
  TransactionType.simpleSend,
];

const Header = () => {
  const { networkImageUrl, networkDisplayName } = useConfirmationNetworkInfo();
  const { senderAddress: fromAddress, senderName: fromName } =
    useConfirmationRecipientInfo();

  const { currentConfirmation } = useConfirmContext<Confirmation>();

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

  // The new header includes only a heading, the advanced details toggle, and a
  // back button if it's a wallet initiated confirmation. The default header is
  // the original header for the redesigns and includes the sender and recipient
  // addresses as well.
  const isConfirmationWithNewHeader =
    currentConfirmation?.type &&
    CONFIRMATIONS_WITH_NEW_HEADER.includes(currentConfirmation.type);
  const isWalletInitiated =
    (currentConfirmation as TransactionMeta)?.origin === ORIGIN_METAMASK;
  if (isConfirmationWithNewHeader && isWalletInitiated) {
    return <WalletInitiatedHeader />;
  } else if (isConfirmationWithNewHeader && !isWalletInitiated) {
    return <DAppInitiatedHeader />;
  }
  return DefaultHeader;
};

export default Header;
