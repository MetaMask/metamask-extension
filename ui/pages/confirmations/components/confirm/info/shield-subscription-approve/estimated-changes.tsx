import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { NameType } from '@metamask/name-controller';
import { Hex } from '@metamask/utils';
import React from 'react';
import {
  ProductPrice,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import { ConfirmInfoRow } from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import Name from '../../../../../../components/app/name';
import { TextColor } from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';

export const EstimatedChanges = ({
  approvalAmount,
  tokenAddress,
  chainId,
  productPrice,
}: {
  approvalAmount: string;
  tokenAddress: Hex;
  chainId: Hex;
  productPrice?: ProductPrice;
}) => {
  const t = useI18nContext();

  const isYearlySubscription =
    productPrice?.interval === RECURRING_INTERVALS.year;

  return (
    <ConfirmInfoSection data-testid="shield-subscription-approve__estimated_changes_section">
      <ConfirmInfoRow
        label={t('estimatedChanges')}
        color={TextColor.textAlternative}
        tooltip={
          isYearlySubscription
            ? null
            : t('shieldEstimatedChangesMonthlyTooltipText', [
                `$${approvalAmount}`,
                `$${Number(approvalAmount) / 12}`,
              ])
        }
      />
      <ConfirmInfoRow label={t('youApprove')} color={TextColor.textAlternative}>
        <Box flexDirection={BoxFlexDirection.Row}>
          <span style={{ marginRight: '8px' }}>{approvalAmount}</span>
          <Name
            value={tokenAddress}
            type={NameType.ETHEREUM_ADDRESS}
            preferContractSymbol
            variation={chainId}
          />
        </Box>
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};
