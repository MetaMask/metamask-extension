import React from 'react';
import { action } from '@storybook/addon-actions';
import MetaMetricsOptIn from './metametrics-opt-in.component';

export default {
  title: 'First Time Flow',
};

export const MetaMetricsOptInComponent = () => {
  return (
    <MetaMetricsOptIn
      setParticipateInMetaMetrics={action('Participating in MetaMetrics')}
    />
  );
};
