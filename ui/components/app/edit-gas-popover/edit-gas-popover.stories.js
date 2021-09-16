import React from 'react';
import EditGasPopover from '.';

export default {
  title: 'Edit Gas Display Popover',
  id: __filename,
};

export const basic = () => (
  <div style={{ width: '600px' }}>
    <EditGasPopover />
  </div>
);

export const basicWithDifferentButtonText = () => (
  <div style={{ width: '600px' }}>
    <EditGasPopover confirmButtonText="Custom Value" />
  </div>
);

export const educationalContentFlow = () => (
  <div style={{ width: '600px' }}>
    <EditGasPopover editGasDisplayProps={{ showEducationButton: true }} />
  </div>
);
