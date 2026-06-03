import React, { useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import {
  ButtonIcon,
  ButtonIconSize,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PopoverPosition } from '../../../components/component-library';
import {
  getValidationErrors,
  getFormattedPriceImpactPercentage,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { JustifyContent } from '../../../helpers/constants/design-system';
import { Row, Tooltip } from '../layout';

type PriceImpactRowProps = {
  onOpenPriceImpactWarningModal: () => void;
};

export const PriceImpactQuoteDetailsRow = ({
  onOpenPriceImpactWarningModal,
}: PriceImpactRowProps) => {
  const t = useI18nContext();
  const { isPriceImpactWarning, isPriceImpactError } = useSelector(
    getValidationErrors,
    shallowEqual,
  );
  const formattedPriceImpact = useSelector(getFormattedPriceImpactPercentage);

  const priceImpactTextColor = useMemo(() => {
    if (isPriceImpactWarning) {
      return TextColor.WarningDefault;
    }
    if (isPriceImpactError) {
      return TextColor.ErrorDefault;
    }
    return TextColor.TextAlternative;
  }, [isPriceImpactWarning, isPriceImpactError]);

  if (!formattedPriceImpact) {
    return null;
  }

  return (
    <Row justifyContent={JustifyContent.spaceBetween}>
      <Row gap={2}>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('bridgePriceImpact')}
        </Text>
        <Tooltip
          title={
            isPriceImpactWarning || isPriceImpactError
              ? t('bridgePriceImpactWarningTitle')
              : t('bridgePriceImpactTooltipTitle')
          }
          position={PopoverPosition.TopStart}
          offset={[-16, 16]}
        >
          {t('bridgePriceImpactNormalDescription')}
        </Tooltip>
      </Row>
      <Row gap={1}>
        {(isPriceImpactWarning || isPriceImpactError) && (
          <ButtonIcon
            iconName={isPriceImpactWarning ? IconName.Warning : IconName.Danger}
            size={ButtonIconSize.Sm}
            className={
              isPriceImpactWarning
                ? IconColor.WarningDefault
                : IconColor.ErrorDefault
            }
            onClick={onOpenPriceImpactWarningModal}
            ariaLabel={t('bridgePriceImpactWarningAriaLabel')}
            data-testid="price-impact-warning-button"
          />
        )}
        <Text variant={TextVariant.BodySm} color={priceImpactTextColor}>
          {formattedPriceImpact}
        </Text>
      </Row>
    </Row>
  );
};
