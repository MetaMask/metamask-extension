import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../../shared/constants/network';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  Display,
  FlexWrap,
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getNetworkConfigurationsByChainId } from '../../../../../../selectors';
import { useConfirmContext } from '../../../../context/confirm';

export const TokenDetailsSection = () => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId } = transactionMeta;
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const networkName = networkConfigurations[chainId].name;

  const networkRow = (
    <ConfirmInfoRow label={t('transactionFlowNetwork')}>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        flexWrap={FlexWrap.Wrap}
        gap={2}
        minWidth={BlockSize.Zero}
      >
        <AvatarNetwork
          borderColor={BorderColor.backgroundDefault}
          size={AvatarNetworkSize.Sm}
          src={
            CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
              chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
            ]
          }
          name={networkName}
        />
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {networkName}
        </Text>
      </Box>
    </ConfirmInfoRow>
  );

  const tokenRow = (
    <ConfirmInfoRow label={t('interactingWith')}>
      <ConfirmInfoRowAddress address={transactionMeta.txParams.to as string} />
    </ConfirmInfoRow>
  );

  return (
    <ConfirmInfoSection data-testid="confirmation__transaction-flow">
      {networkRow}
      {tokenRow}
    </ConfirmInfoSection>
  );
};
