///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useCallback, useRef, useState } from 'react';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
} from '../../../../../../shared/constants/musd';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  ButtonLinkSize,
  HeaderBase,
  IconName,
  Popover,
  PopoverPosition,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useConfirmActions } from '../../../hooks/useConfirmActions';

/**
 * MusdConversionHeader Component
 *
 * Custom header for mUSD conversion confirmations.
 * Displays a dark header bar with:
 * - Left: back chevron button
 * - Center: "Convert and get 3%" title (visually centered via HeaderBase)
 * - Right: info icon with bonus explanation tooltip
 *
 * Ported from metamask-mobile:
 * app/components/UI/Earn/hooks/useMusdConversionNavbar.tsx
 */
export const MusdConversionHeader = () => {
  const t = useI18nContext();
  const { onCancel } = useConfirmActions();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);

  const handleBackButtonClick = useCallback(() => {
    onCancel({
      location: MetaMetricsEventLocation.Confirmation,
      navigateBackForSend: true,
    });
  }, [onCancel]);

  const handleInfoClick = useCallback(() => {
    setIsTooltipOpen((prev) => !prev);
  }, []);

  const handleCloseTooltip = useCallback(() => {
    setIsTooltipOpen(false);
  }, []);

  if (!currentConfirmation) {
    return null;
  }

  return (
    <HeaderBase
      backgroundColor={BackgroundColor.backgroundDefault}
      padding={4}
      alignItems={AlignItems.center}
      style={{ zIndex: 2 }}
      data-testid="musd-conversion-header"
      startAccessory={
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back')}
          size={ButtonIconSize.Md}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={handleBackButtonClick}
          data-testid="musd-conversion-header-back-button"
          color={IconColor.iconDefault}
        />
      }
      endAccessory={
        <Box>
          <ButtonIcon
            ref={infoButtonRef}
            ariaLabel="info"
            iconName={IconName.Info}
            size={ButtonIconSize.Md}
            onClick={handleInfoClick}
            data-testid="musd-conversion-header-info-button"
            color={IconColor.iconDefault}
          />
          <Popover
            isOpen={isTooltipOpen}
            position={PopoverPosition.BottomEnd}
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
            data-testid="musd-conversion-header-tooltip"
          >
            <Text variant={TextVariant.bodyMd} color={TextColor.infoInverse}>
              {t('musdBonusExplanation', [
                String(MUSD_CONVERSION_APY),
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
      childrenWrapperProps={{
        display: Display.Flex,
        justifyContent: JustifyContent.center,
        alignItems: AlignItems.center,
        paddingTop: 4,
        paddingRight: 8,
        paddingBottom: 4,
        paddingLeft: 8,
      }}
    >
      <Text
        variant={TextVariant.headingSm}
        color={TextColor.textDefault}
        textAlign={TextAlign.Center}
        data-testid="musd-conversion-header-title"
      >
        {t('musdConvertAndGetBonus')}
      </Text>
    </HeaderBase>
  );
};
///: END:ONLY_INCLUDE_IF
