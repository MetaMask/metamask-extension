import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';

export type MusdPositionSectionProps = {
  /** Display balance string for the current chain (e.g. from token cell) */
  balanceDisplay: string;
  /** Fiat value of the position */
  fiatValue: number | null;
  /** When false, hide fiat value row */
  showFiat: boolean;
};

/**
 * "Your position" block on the mUSD asset details page (balance + value grid).
 * @param options0
 * @param options0.balanceDisplay
 * @param options0.fiatValue
 * @param options0.showFiat
 */
export function MusdPositionSection({
  balanceDisplay,
  fiatValue,
  showFiat,
}: MusdPositionSectionProps) {
  const t = useI18nContext();
  const formatFiat = useFiatFormatter();

  const valueDisplay =
    showFiat && fiatValue !== null && Number.isFinite(fiatValue)
      ? formatFiat(fiatValue)
      : '—';

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={3}
      paddingBottom={3}
      gap={3}
      data-testid="musd-position-section"
    >
      <Text variant={TextVariant.HeadingSm}>{t('musdAssetPositionTitle')}</Text>
      <Box flexDirection={BoxFlexDirection.Row} gap={3}>
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={1}
          style={{ flex: 1 }}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {t('musdAssetPositionBalance')}
          </Text>
          <Text variant={TextVariant.BodyMd}>{balanceDisplay || '0'}</Text>
        </Box>
        {showFiat ? (
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={1}
            style={{ flex: 1 }}
          >
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
            >
              {t('musdAssetPositionValue')}
            </Text>
            <Text variant={TextVariant.BodyMd}>{valueDisplay}</Text>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

export default MusdPositionSection;
