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
