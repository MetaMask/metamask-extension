import React from 'react';
import {
  MetaMetricsProvider as NewMetaMetricsProvider,
  LegacyMetaMetricsProvider as NewLegacyMetaMetricsProvider,
} from '../ui/contexts/metametrics.new';

const MetaMetricsProviderStorybook = (props) => 
    (
        <NewMetaMetricsProvider>
          <NewLegacyMetaMetricsProvider>
            {props.children}
          </NewLegacyMetaMetricsProvider>
        </NewMetaMetricsProvider>
  );

export default MetaMetricsProviderStorybook