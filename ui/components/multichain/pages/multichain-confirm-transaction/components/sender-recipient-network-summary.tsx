import React, { useContext } from 'react';
import { NameType } from '@metamask/name-controller';
import { DraftTransaction } from '../../../../../ducks/multichain-send/multichain-send';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../component-library';
import { I18nContext } from '../../../../../contexts/i18n';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { MultichainProviderConfig } from '../../../../../../shared/constants/multichain/networks';
import Jazzicon from '../../../../ui/jazzicon';
import { shortenAddress } from '../../../../../helpers/utils/util';
import Name from '../../../../app/name';
import { SummaryRow } from './summary-row';

export type SenderRecipientNetworkSummaryProps = {
  transactionParams: DraftTransaction['transactionParams'];
  network: MultichainProviderConfig;
};

export const SenderRecipientNetworkSummary = ({
  transactionParams,
  network,
}: SenderRecipientNetworkSummaryProps) => {
  const t = useContext(I18nContext);

  const handleRecipientLinkClick = () => {
    global.platform.openTab({
      url: '',
    });
  };

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.LG}
      marginBottom={4}
      padding={4}
      gap={2}
    >
      <SummaryRow label={t('fromAccountLabel')}>
        <Name
          value={transactionParams.sender.address}
          type={'multichainAddress' as NameType}
          // Name controller current doesn't support addresses other than EVM addresses.
          disableEdit
        />
      </SummaryRow>
      <SummaryRow label={t('recipientLabel')}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.flexEnd}
          alignItems={AlignItems.center}
        >
          <Jazzicon
            address={transactionParams.recipient.address}
            diameter={16}
          />
          <Text marginLeft={2} data-testid="recipient-address">
            {shortenAddress(transactionParams.recipient.address)}
          </Text>
          <ButtonIcon
            iconName={IconName.Export}
            color={IconColor.infoDefault}
            size={ButtonIconSize.Sm}
            ariaLabel="recipient-account-lint"
            onClick={handleRecipientLinkClick}
          />
        </Box>
      </SummaryRow>
      <SummaryRow label={t('networkLabel')}>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexEnd}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
        >
          <AvatarNetwork
            className="mm-picker-network__avatar-network"
            src={network.rpcPrefs?.imageUrl ?? ''}
            name={network.nickname}
            size={AvatarNetworkSize.Xs}
            marginRight={2}
          />
          <Text
            color={TextColor.textDefault}
            data-testid="multichain-confirmation-destination-network"
          >
            {network.nickname}
          </Text>
        </Box>
      </SummaryRow>
    </Box>
  );
};
