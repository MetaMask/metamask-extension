import React from 'react';
import PopoverPortal from '../../ui/popover/popover.component';
import Button from '../../ui/button';
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

export const insidePopover = () => {
  return (
    <div style={{ width: '600px' }}>
      <PopoverPortal
        title="Edit gas fee"
        onClose={() => console.log('Closing!')}
        footer={
          <>
            <Button type="primary">Save</Button>
          </>
        }
      >
        <div style={{ padding: '20px' }}>
          <EditGasDisplay />
        </div>
      </PopoverPortal>
    </div>
  );
};
