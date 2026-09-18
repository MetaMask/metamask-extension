import React from 'react';
import { MetaMetricsProvider } from '../ui/contexts/metametrics';

const MetaMetricsProviderStorybook = (props) => (
  <MetaMetricsProvider>{props.children}</MetaMetricsProvider>
);

export default MetaMetricsProviderStorybook;