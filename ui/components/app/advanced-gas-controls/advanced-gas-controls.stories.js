import React from 'react';

import AdvancedGasControls from '.';

export default {
  title: 'Components/App/Advanced Gas Controls',
  id: __filename,
};

export const Base = () => {
  return (
    <div style={{ width: '600px' }}>
      <AdvancedGasControls />
    </div>
  );
};
