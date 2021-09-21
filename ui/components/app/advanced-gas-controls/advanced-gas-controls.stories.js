import React from 'react';

import AdvancedGasControls from '.';

export default {
  title: 'Advanced Gas Controls',
  id: __filename,
};

export const simple = () => {
  return (
    <div style={{ width: '600px' }}>
      <AdvancedGasControls />
    </div>
  );
};
