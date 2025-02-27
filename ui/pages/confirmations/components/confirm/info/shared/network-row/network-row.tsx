import React from 'react';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';

import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../../../../../shared/modules/selectors/networks';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  Display,
  FlexWrap,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../../../context/confirm';

export const NetworkRow = ({
  isShownWithAlertsOnly = false,
}: {
  isShownWithAlertsOnly?: boolean;
}) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext() ?? {};
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  if (!currentConfirmation) {
    return null;
  }

  const chainId = (currentConfirmation.chainId as Hex) ?? '';
  const networkName = chainId ? networkConfigurations[chainId]?.name : '';
  const networkImageUrl = chainId
    ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ]
    : '';

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.Network}
      ownerId={currentConfirmation.id}
      label={t('transactionFlowNetwork')}
      isShownWithAlertsOnly={isShownWithAlertsOnly}
    >
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
          src={networkImageUrl}
          name={networkName}
        />
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {networkName}
        </Text>
      </Box>
    </ConfirmInfoAlertRow>
  );
};
