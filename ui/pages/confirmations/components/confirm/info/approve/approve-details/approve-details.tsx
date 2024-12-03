import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../../context/confirm';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../../selectors/preferences';
import { SigningInWithRow } from '../../shared/sign-in-with-row/sign-in-with-row';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
import { Container } from '../../shared/transaction-data/transaction-data';
import {
  MethodDataRow,
  OriginRow,
  RecipientRow,
} from '../../shared/transaction-details/transaction-details';
import { getIsRevokeSetApprovalForAll } from '../../utils';
import { useIsNFT } from '../hooks/use-is-nft';

const Spender = ({
  isSetApprovalForAll = false,
}: {
  isSetApprovalForAll?: boolean;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { isNFT } = useIsNFT(transactionMeta);

  const decodedResponse = useDecodedTransactionData();

  const { value, pending } = decodedResponse;

  if (pending) {
    return <Container isLoading />;
  }

  if (!value) {
    return null;
  }

  const spender = value.data[0].params[0].value;
  const { chainId } = transactionMeta;

  if (getIsRevokeSetApprovalForAll(value)) {
    return null;
  }

  return (
    <>
      <ConfirmInfoRow
        label={t(isSetApprovalForAll ? 'permissionFor' : 'spender')}
        tooltip={t(
          isNFT ? 'spenderTooltipDesc' : 'spenderTooltipERC20ApproveDesc',
        )}
        data-testid="confirmation__approve-spender"
      >
        <ConfirmInfoRowAddress address={spender} chainId={chainId} />
      </ConfirmInfoRow>

      <ConfirmInfoRowDivider />
    </>
  );
};

export const ApproveDetails = ({
  isSetApprovalForAll = false,
}: {
  isSetApprovalForAll?: boolean;
}) => {
  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  return (
    <ConfirmInfoSection data-testid="confirmation__approve-details">
      <Spender isSetApprovalForAll={isSetApprovalForAll} />
      <OriginRow />
      <SigningInWithRow />
      {showAdvancedDetails && (
        <>
          <RecipientRow />
          <MethodDataRow />
        </>
      )}
    </ConfirmInfoSection>
  );
};
