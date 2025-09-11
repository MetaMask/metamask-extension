import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import React from 'react';
import { Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { ellipsify } from '../../../send-legacy/send.utils';

export const NonContractAddressAlertMessage = (
  networkConfigurations: Record<Hex, { name: string }>,
) => {
  const t = useI18nContext();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const networkName =
    currentConfirmation?.chainId &&
    networkConfigurations[currentConfirmation.chainId as Hex].name;
  const recipientAddress = ellipsify(currentConfirmation?.txParams.to);

  return (
    <>
      <Text
        variant={TextVariant.bodyMd}
        color={TextColor.textDefault}
        data-testid="alert-modal__selected-alert"
      >
        {t('nonContractAddressAlertDesc')}
      </Text>
      <Text
        variant={TextVariant.bodyMd}
        color={TextColor.textDefault}
        marginTop={2}
        data-testid="alert-modal__selected-alert"
      >
        <strong>Network:</strong> {networkName}
      </Text>
      <Text
        variant={TextVariant.bodyMd}
        color={TextColor.textDefault}
        data-testid="alert-modal__selected-alert"
      >
        <strong>Address:</strong> {recipientAddress}
      </Text>
    </>
  );
};
