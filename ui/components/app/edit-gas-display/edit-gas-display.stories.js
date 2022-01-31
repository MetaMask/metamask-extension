import React from 'react';
import EditGasDisplay from '.';

export default {
  title: 'Components/App/EditGasDisplay',
  id: __filename,
};

export const DefaultStory = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasDisplay />
    </div>
  );
};

DefaultStory.storyName = 'Default';

export const WithEducation = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasDisplay showEducationButton />
    </div>
  );
};

export const WithDappSuggestedGas = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasDisplay
        dappSuggestedGasFee="100000"
        dappOrigin="davidwalsh.name"
      />
    </div>
  );
};
