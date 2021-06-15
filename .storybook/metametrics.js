import React from 'react';
import {
  MetaMetricsProvider,
  LegacyMetaMetricsProvider,
} from '../ui/contexts/metametrics';
import {
  MetaMetricsProvider as NewMetaMetricsProvider,
  LegacyMetaMetricsProvider as NewLegacyMetaMetricsProvider,
} from '../ui/contexts/metametrics.new';

const MetaMetricsProviderStorybook = (props) => 
    (
    <MetaMetricsProvider>
      <LegacyMetaMetricsProvider>
        <NewMetaMetricsProvider>
          <NewLegacyMetaMetricsProvider>
            {props.children}
          </NewLegacyMetaMetricsProvider>
        </NewMetaMetricsProvider>
      </LegacyMetaMetricsProvider>
    </MetaMetricsProvider>
  );

export default MetaMetricsProviderStorybook