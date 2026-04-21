import React, { useContext } from 'react';
import {
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PopoverPosition } from '../../../../../components/component-library';
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
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';

export type ClaimableBonusRowProps = {
  rowVariant?: ConfirmInfoRowSize;
};

export function ClaimableBonusRow({
  rowVariant = ConfirmInfoRowSize.Default,
}: Readonly<ClaimableBonusRowProps>) {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const isLoading = useIsTransactionPayLoading();

  const isSmall = rowVariant === ConfirmInfoRowSize.Small;

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
          position={PopoverPosition.TopStart}
          iconName={IconName.Question}
          iconColor={IconColor.IconAlternative}
          iconMarginLeft={1}
          plainIcon
          ariaLabel={t('musdClaimableBonusTooltipAria') as string}
          data-testid="claimable-bonus-tooltip-popover"
        >
          <Text variant={TextVariant.BodyMd} color={TextColor.InfoInverse}>
            {t('musdClaimableBonusTooltip', [
              <TextButton
                key="terms-link"
                size={TextButtonSize.BodyMd}
                isInverse
                asChild
              >
                <a
                  href={MUSD_CONVERSION_BONUS_TERMS_OF_USE}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline' }}
                  onClick={() => {
                    const properties = {
                      location: 'percentage_row',
                      url: MUSD_CONVERSION_BONUS_TERMS_OF_USE,
                    };

                    trackEvent({
                      event: MetaMetricsEventName.MusdBonusTermsOfUsePressed,
                      category: MetaMetricsEventCategory.MusdConversion,
                      properties,
                    });
                  }}
                >
                  {t('musdTermsApply')}
                </a>
              </TextButton>,
            ])}
          </Text>
        </InfoPopoverTooltip>
      }
    >
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={isSmall ? undefined : FontWeight.Medium}
        color={TextColor.TextAlternative}
        data-testid="claimable-bonus-value"
      >
        {`${MUSD_CONVERSION_APY}%`}
      </Text>
    </ConfirmInfoRow>
  );
}
