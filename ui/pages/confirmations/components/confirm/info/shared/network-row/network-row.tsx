import React from 'react';
import { useSelector } from 'react-redux';

import { Hex } from '@metamask/utils';
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
  Display,
  FlexWrap,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { useUnapprovedTransaction } from '../../../../../hooks/transactions/useUnapprovedTransaction';
import { useSignatureRequest } from '../../../../../hooks/signatures/useSignatureRequest';

export const NetworkRow = ({
  isShownWithAlertsOnly = false,
}: {
  isShownWithAlertsOnly?: boolean;
}) => {
  const t = useI18nContext();
  const transactionMeta = useUnapprovedTransaction();
  const signatureRequest = useSignatureRequest();
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  if (!transactionMeta && !signatureRequest) {
    return null;
  }

  const chainId = transactionMeta
    ? transactionMeta?.chainId
    : signatureRequest?.chainId;

  const ownerId = (transactionMeta?.id ?? signatureRequest?.id) as string;

  const networkName = chainId
    ? networkConfigurations[chainId as Hex]?.name
    : '';
  const networkImageUrl = chainId
    ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ]
    : '';

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.Network}
      ownerId={ownerId}
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
          size={AvatarNetworkSize.Xs}
          src={networkImageUrl}
          name={networkName}
          style={{ borderWidth: 0 }}
        />
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {networkName}
        </Text>
      </Box>
    </ConfirmInfoAlertRow>
  );
};
