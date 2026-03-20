import React, { useContext, type ReactNode } from 'react';
import {
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
} from '../../../../../components/app/musd/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { InfoPopoverTooltip } from '../../info-popover-tooltip';

type HeaderContent = {
  title: ReactNode;
  endAccessory: ReactNode;
};

export function useMusdConversionHeaderContent(): HeaderContent {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);

  return {
    title: t('musdConvertAndGetBonus', [String(MUSD_CONVERSION_APY)]),
    endAccessory: (
      <InfoPopoverTooltip data-testid="musd-conversion-header-tooltip">
        <Text variant={TextVariant.BodyMd} color={TextColor.InfoInverse}>
          {t('musdBonusExplanation', [
            String(MUSD_CONVERSION_APY),
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
                    location: 'custom_amount_navbar',
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
    ),
  };
}
