import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Header } from '../../../components/multichain/pages/page';

type PrivacySettingsSubPageHeaderProps = {
  title: string;
  onBack: () => void;
};

export const PrivacySettingsSubPageHeader = ({
  title,
  onBack,
}: PrivacySettingsSubPageHeaderProps) => {
  const t = useI18nContext();

  const startAccessory = (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={1}
    >
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        ariaLabel={t('back')}
        size={ButtonIconSize.Md}
        onClick={onBack}
        data-testid="privacy-settings-sub-page-back-button"
      />
    </Box>
  );

  return <Header startAccessory={startAccessory}>{title}</Header>;
};
