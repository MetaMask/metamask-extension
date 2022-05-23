import React from 'react';
import {
  MetaMetricsProvider,
  LegacyMetaMetricsProvider
} from '../ui/contexts/metametrics';

const MetaMetricsProviderStorybook = (props) => 
    (
        <MetaMetricsProvider>
          <LegacyMetaMetricsProvider>
            {props.children}
          </LegacyMetaMetricsProvider>
        </MetaMetricsProvider>
  );

export default MetaMetricsProviderStorybook