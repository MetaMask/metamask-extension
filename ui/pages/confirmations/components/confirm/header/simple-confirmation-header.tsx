import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextButton,
  TextButtonSize,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
} from '../../../../../components/app/musd/constants';
import {
  HeaderBase,
  Popover,
  PopoverPosition,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import { AdvancedDetailsButton } from './advanced-details-button';

const MusdInfoTooltip = () => {
  const t = useI18nContext();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);

  const handleInfoClick = useCallback(() => {
    setIsTooltipOpen((prev) => !prev);
  }, []);

  const handleCloseTooltip = useCallback(() => {
    setIsTooltipOpen(false);
  }, []);

  return (
    <Box>
      <ButtonIcon
        ref={infoButtonRef}
        ariaLabel="info"
        iconName={IconName.Info}
        size={ButtonIconSize.Md}
        onClick={handleInfoClick}
        data-testid="musd-conversion-header-info-button"
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
              >
                {t('musdTermsApply')}
              </a>
            </TextButton>,
          ])}
        </Text>
      </Popover>
    </Box>
  );
};

function useSimpleHeaderContent(): {
  title: ReactNode;
  endAccessory: ReactNode;
} {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  if (currentConfirmation?.type === TransactionType.musdConversion) {
    return {
      title: t('musdConvertAndGetBonus', [String(MUSD_CONVERSION_APY)]),
      endAccessory: <MusdInfoTooltip />,
    };
  }

  return {
    title: t('review'),
    endAccessory: <AdvancedDetailsButton />,
  };
}

export const SimpleConfirmationHeader = () => {
  const t = useI18nContext();
  const { onCancel } = useConfirmActions();
  const { title, endAccessory } = useSimpleHeaderContent();

  const handleBackButtonClick = useCallback(() => {
    onCancel({
      location: MetaMetricsEventLocation.Confirmation,
      navigateBackToPreviousPage: true,
    });
  }, [onCancel]);

  return (
    <HeaderBase
      backgroundColor={BackgroundColor.backgroundDefault}
      padding={4}
      alignItems={AlignItems.center}
      style={{ zIndex: 2 }}
      data-testid="simple-confirmation-header"
      startAccessory={
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back')}
          size={ButtonIconSize.Md}
          onClick={handleBackButtonClick}
          data-testid="simple-confirmation-header-back-button"
        />
      }
      endAccessory={endAccessory}
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
        variant={TextVariant.HeadingSm}
        color={TextColor.TextDefault}
        textAlign={TextAlign.Center}
        data-testid="simple-confirmation-header-title"
      >
        {title}
      </Text>
    </HeaderBase>
  );
};
