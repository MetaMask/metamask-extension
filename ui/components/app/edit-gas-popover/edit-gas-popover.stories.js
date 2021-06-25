import React from 'react';
import EditGasPopover from '.';

export default {
  title: 'Edit Gas Display Popover',
};

export const basic = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasPopover />
    </div>
  );
};

export const basicWithDifferentButtonText = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasPopover confirmButtonText="Custom Value" />
    </div>
  );
};

export const educationalContentFlow = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasPopover editGasDisplayProps={{ showEducationButton: true }} />
    </div>
  );
};
