import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { NameType } from '@metamask/name-controller';
import { Hex } from '@metamask/utils';
import React from 'react';
import { ConfirmInfoRow } from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import Name from '../../../../../../components/app/name';
import { TextColor } from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';

export const EstimatedChanges = ({
  approvalAmount,
  tokenAddress,
  chainId,
}: {
  approvalAmount: string;
  tokenAddress: Hex;
  chainId: Hex;
}) => {
  const t = useI18nContext();

  const isMonthlySubscription = approvalAmount === '96';

  return (
    <ConfirmInfoSection data-testid="shield-subscription-approve__estimated_changes_section">
      <ConfirmInfoRow
        label={t('estimatedChanges')}
        color={TextColor.textAlternative}
        tooltip={
          isMonthlySubscription
            ? t('shieldEstimatedChangesMonthlyTooltip', [
                approvalAmount,
                Number(approvalAmount) / 12,
              ])
            : null
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
