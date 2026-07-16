import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FontWeight, Text, TextVariant } from '@metamask/design-system-react';
import { ScreenViewedEntryPoint } from '../../../shared/constants/metametrics';
import { Page } from '../../components/multichain/pages/page';
import { ScrollContainer } from '../../contexts/scroll-container';
import { useI18nContext } from '../../hooks/useI18nContext';
import { ActivityList } from './activity-list';

// Page shown when the Activity tab in the bottom navigation bar is clicked
// Bottom navigation bar is shown in the A/B test coreExtensionUxCeux1141AbtestBottomNav
export const ActivityPage = () => {
  const t = useI18nContext();
  const location = useLocation();
  const [entryPoint] = useState(() =>
    location.state?.entryPoint === ScreenViewedEntryPoint.BottomNavClick
      ? ScreenViewedEntryPoint.BottomNavClick
      : undefined,
  );

  return (
    <Page data-testid="activity-page">
      <Text
        variant={TextVariant.HeadingLg}
        fontWeight={FontWeight.Bold}
        className="pt-4 px-4 pb-2"
      >
        {t('activity')}
      </Text>
      <ScrollContainer className="flex-1 overflow-auto">
        <ActivityList entryPoint={entryPoint} />
      </ScrollContainer>
    </Page>
  );
};

export default ActivityPage;
