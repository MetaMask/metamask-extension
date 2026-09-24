import React from 'react';
import { Text } from '../../../../components/component-library';
import CL24BenchmarkPanel from '../../../../components/app/cl24-benchmark';
import { getIsCL24BenchmarkEnabled } from '../../../../../shared/lib/environment';

const CL24BenchmarkSection = () => {
  if (!getIsCL24BenchmarkEnabled()) {
    return null;
  }

  return (
    <>
      <Text className="settings-page__security-tab-sub-header__bold">
        CL24 benchmark
      </Text>
      <div className="settings-page__content-padded">
        <div className="settings-page__content-description">
          Times a full CL24 distributed key management lifecycle (key
          generation, export, share refresh, adding a party, final export) and
          reports the local party&apos;s CPU cost. Runs on the UI thread for
          several seconds, so open the extension in a full tab &mdash; the popup
          closes when it loses focus.
        </div>
        <CL24BenchmarkPanel />
      </div>
    </>
  );
};

export default CL24BenchmarkSection;
