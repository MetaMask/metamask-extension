import React, { useCallback, useRef, useState } from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  ButtonLinkSize,
  IconName,
  Popover,
  PopoverPosition,
  Text,
} from '../../../../../components/component-library';
import {
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
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
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);

  const handleInfoClick = useCallback(() => {
    setIsTooltipOpen((prev) => !prev);
  }, []);

  const handleCloseTooltip = useCallback(() => {
    setIsTooltipOpen(false);
  }, []);

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
        <Box>
          <ButtonIcon
            ref={infoButtonRef}
            ariaLabel="info"
            iconName={IconName.Info}
            size={ButtonIconSize.Sm}
            onClick={handleInfoClick}
            data-testid="claimable-bonus-row-tooltip"
            color={IconColor.iconAlternative}
            marginLeft={1}
          />
          <Popover
            isOpen={isTooltipOpen}
            position={PopoverPosition.BottomStart}
            referenceElement={infoButtonRef.current}
            hasArrow
            onPressEscKey={handleCloseTooltip}
            onClickOutside={handleCloseTooltip}
            isPortal
            style={{
              zIndex: 3,
              backgroundColor: 'var(--color-text-default)',
              paddingInline: '6px',
              paddingTop: '6px',
              paddingBottom: '6px',
              paddingLeft: '16px',
              paddingRight: '16px',
              maxWidth: 240,
            }}
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
          </Popover>
        </Box>
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
