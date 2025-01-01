import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { ORIGIN_METAMASK } from '../../../../../../../shared/constants/app';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../../../../shared/modules/selectors/networks';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
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
import { useConfirmContext } from '../../../../context/confirm';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { useBalanceChanges } from '../../../simulation-details/useBalanceChanges';
import { OriginRow } from '../shared/transaction-details/transaction-details';

export const TokenDetailsSection = () => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId } = transactionMeta;
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const networkName = networkConfigurations[chainId].name;

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const isSimulationError = Boolean(
    transactionMeta.simulationData?.error?.code,
  );
  const balanceChangesResult = useBalanceChanges({
    chainId,
    simulationData: transactionMeta.simulationData,
  });
  const balanceChanges = balanceChangesResult.value;
  const isSimulationEmpty = balanceChanges.length === 0;

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
          size={AvatarNetworkSize.Xs}
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

  const shouldShowTokenRow =
    transactionMeta.type !== TransactionType.simpleSend &&
    (showAdvancedDetails || isSimulationEmpty || isSimulationError);

  const tokenRow = shouldShowTokenRow && (
    <ConfirmInfoRow
      label={t('interactingWith')}
      tooltip={t('interactingWithTransactionDescription')}
    >
      <ConfirmInfoRowAddress
        address={transactionMeta.txParams.to as string}
        chainId={chainId}
      />
    </ConfirmInfoRow>
  );

  const shouldShowOriginRow = transactionMeta?.origin !== ORIGIN_METAMASK;

  return (
    <ConfirmInfoSection data-testid="confirmation__token-details-section">
      {networkRow}
      {(shouldShowOriginRow || shouldShowTokenRow) && <ConfirmInfoRowDivider />}
      {shouldShowOriginRow && <OriginRow />}
      {tokenRow}
    </ConfirmInfoSection>
  );
};
