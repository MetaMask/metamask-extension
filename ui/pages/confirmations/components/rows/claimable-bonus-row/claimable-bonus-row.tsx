import React from 'react';
import {
  ButtonIconSize,
  ButtonLink,
  ButtonLinkSize,
  PopoverPosition,
  Text,
} from '../../../../../components/component-library';
import {
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { InfoPopoverTooltip } from '../../info-popover-tooltip';
import {
  ConfirmInfoRow,
  ConfirmInfoRowSize,
  ConfirmInfoRowSkeleton,
} from '../../../../../components/app/confirm/info/row/row';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useIsTransactionPayLoading } from '../../../hooks/pay/useTransactionPayData';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
} from '../../../../../components/app/musd/constants';

export type ClaimableBonusRowProps = {
  rowVariant?: ConfirmInfoRowSize;
};

export function ClaimableBonusRow({
  rowVariant = ConfirmInfoRowSize.Default,
}: ClaimableBonusRowProps) {
  const t = useI18nContext();
  const isLoading = useIsTransactionPayLoading();

  const isSmall = rowVariant === ConfirmInfoRowSize.Small;
  const textVariant = isSmall ? TextVariant.bodyMd : TextVariant.bodyMdMedium;

  if (isLoading) {
    return (
      <ConfirmInfoRowSkeleton
        data-testid="claimable-bonus-row-skeleton"
        label={t('musdClaimableBonus')}
        rowVariant={rowVariant}
      />
    );
  }

  return (
    <ConfirmInfoRow
      data-testid="claimable-bonus-row"
      label={t('musdClaimableBonus')}
      rowVariant={rowVariant}
      labelChildren={
        <InfoPopoverTooltip
          position={PopoverPosition.BottomStart}
          iconSize={ButtonIconSize.Sm}
          iconColor={IconColor.iconAlternative}
          iconMarginLeft={1}
          data-testid="claimable-bonus-tooltip-popover"
        >
          <Text variant={TextVariant.bodyMd} color={TextColor.infoInverse}>
            {t('musdClaimableBonusTooltip', [
              <ButtonLink
                key="terms-link"
                size={ButtonLinkSize.Inherit}
                href={MUSD_CONVERSION_BONUS_TERMS_OF_USE}
                externalLink
                color={TextColor.infoInverse}
                style={{ textDecoration: 'underline' }}
              >
                {t('musdTermsApply')}
              </ButtonLink>,
            ])}
          </Text>
        </InfoPopoverTooltip>
      }
    >
      <Text
        variant={textVariant}
        color={TextColor.textAlternative}
        data-testid="claimable-bonus-value"
      >
        {`${MUSD_CONVERSION_APY}%`}
      </Text>
    </ConfirmInfoRow>
  );
}
