import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useDisplayName } from '../../../../../hooks/useDisplayName';
import { toChecksumHexAddress } from '../../../../../../shared/lib/hexstring-utils';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../context/confirm';
import { AccountFlowRow } from '../account-flow-row/account-flow-row';

export const MusdClaimAccountRow = () => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const fromAddress = transactionMeta.txParams.from;

  const {
    name,
    isAccount,
    image,
    displayState,
    subtitle: walletName,
  } = useDisplayName({
    value: toChecksumHexAddress(fromAddress),
    type: NameType.ETHEREUM_ADDRESS,
    preferContractSymbol: true,
    variation: transactionMeta.chainId,
  });

  const label = walletName
    ? t('musdClaimSendingToWallet', [walletName])
    : t('musdClaimSendingTo');

  return (
    <AccountFlowRow
      address={fromAddress}
      label={label}
      alertKey={RowAlertKey.SigningInWith}
      name={name}
      isAccount={isAccount}
      image={image}
      displayState={displayState}
      data-testid="musd-claim-account-address"
    />
  );
};
