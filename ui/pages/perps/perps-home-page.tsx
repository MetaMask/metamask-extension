import React from 'react';
import { Text, FontWeight, TextVariant } from '@metamask/design-system-react';
import { Page } from '../../components/multichain/pages/page';
import { useI18nContext } from '../../hooks/useI18nContext';
import { PerpsTab } from '../../components/app/perps/perps-tab';

// Page shown when the Perps tab in the bottom navigation bar is clicked
// Bottom navigation bar is shown in the A/B test coreExtensionUxCeux1141AbtestBottomNav
export const PerpsHomePage = () => {
  const t = useI18nContext();

  return (
    <Page data-testid="perps-home-page">
      <Text
        variant={TextVariant.HeadingLg}
        fontWeight={FontWeight.Bold}
        className="pt-4 px-4 pb-2"
      >
        {t('perps')}
      </Text>
      <PerpsTab />
    </Page>
  );
};

export default PerpsHomePage;
