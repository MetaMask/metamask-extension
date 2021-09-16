import React from 'react';
import EditGasDisplay from '.';

export default {
  title: 'Edit Gas Display',
  id: __filename,
};

export const basic = () => (
  <div style={{ width: '600px' }}>
    <EditGasDisplay />
  </div>
);

export const withEducation = () => (
  <div style={{ width: '600px' }}>
    <EditGasDisplay showEducationButton />
  </div>
);

export const withDappSuggestedGas = () => (
  <div style={{ width: '600px' }}>
    <EditGasDisplay dappSuggestedGasFee="100000" dappOrigin="davidwalsh.name" />
  </div>
);
