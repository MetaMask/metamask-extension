import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { text } from '@storybook/addon-knobs';
import Button from '../button';
import NetworkDetails from '.';

export default {
  title: 'Components/UI/NetworkDetails',
  id: __filename,
};

export const NetworkDetailsPopover = () => {
  const [showPopover, setShowPopover] = useState(false);
  return (
    <div style={{ width: '600px' }}>
      <Button onClick={() => setShowPopover(true)}>Open Network Details</Button>
      {showPopover && (
        <NetworkDetails
          name={text('address', 'Binance Smart Chain')}
          url="kfkfkfk"
          chainId="12233344"
          onClose={() => action(`Close Update Nickname Popover`)()}
        />
      )}
    </div>
  );
};
