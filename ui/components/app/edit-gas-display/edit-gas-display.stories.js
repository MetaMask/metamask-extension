import React from 'react';
import EditGasDisplay from '.';

export default {
  title: 'Edit Gas Display',
};

export const basic = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasDisplay />
    </div>
  );
};

export const withEducation = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasDisplay showEducationButton />
    </div>
  );
};

export const withDappSuggestedGas = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasDisplay
        dappSuggestedGasFee="100000"
        dappOrigin="davidwalsh.name"
      />
    </div>
  );
};
