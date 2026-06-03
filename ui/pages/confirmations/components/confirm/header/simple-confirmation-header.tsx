import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useCallback, type ReactNode } from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import { HeaderBase } from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import { useMusdConversionHeaderContent } from '../../info/musd-conversion-info';
import { AdvancedDetailsButton } from './advanced-details-button';

const SimpleHeaderLayout = ({
  title,
  endAccessory,
}: Readonly<{
  title: ReactNode;
  endAccessory: ReactNode;
}>) => {
  const t = useI18nContext();
  const { onCancel } = useConfirmActions();

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

const MusdConversionSimpleHeader = () => {
  const { title, endAccessory } = useMusdConversionHeaderContent();
  return <SimpleHeaderLayout title={title} endAccessory={endAccessory} />;
};

const DefaultSimpleHeader = () => {
  const t = useI18nContext();
  return (
    <SimpleHeaderLayout
      title={t('review')}
      endAccessory={<AdvancedDetailsButton />}
    />
  );
};

export const SimpleConfirmationHeader = () => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  if (currentConfirmation?.type === TransactionType.musdConversion) {
    return <MusdConversionSimpleHeader />;
  }

  return <DefaultSimpleHeader />;
};
