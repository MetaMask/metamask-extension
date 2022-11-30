import React from 'react';
import { action } from '@storybook/addon-actions';
import MetaMetricsOptIn from './metametrics-opt-in.component';

export default {
  title: 'Pages/FirstTimeFlow/MetametricsOptIn',
  id: __filename,
};

export const DefaultStory = () => {
  return (
    <MetaMetricsOptIn
      setMetaMetricsParticipationMode={action('Participating in MetaMetrics')}
    />
  );
};

DefaultStory.storyName = 'Default';
