import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { text } from '@storybook/addon-knobs';
import Button from '../button';
import UpdateNicknamePopover from '.';

export default {
  title: 'Components/UI/UpdateNickname',
  id: __filename,
};

export const AddNickname = () => {
  const [showPopover, setShowPopover] = useState(false);
  return (
    <div style={{ width: '600px' }}>
      <Button onClick={() => setShowPopover(true)}>
        Open Add Nickname Popover
      </Button>
      {showPopover && (
        <UpdateNicknamePopover
          address={text('address', '0x0011244f50ff4')}
          onClose={() => action(`Close Update Nickname Popover`)()}
        />
      )}
    </div>
  );
};

export const UpdateNickname = () => {
  const [showPopover, setShowPopover] = useState(false);
  return (
    <div style={{ width: '600px' }}>
      <Button onClick={() => setShowPopover(true)}>
        Open Update Nickname Popover
      </Button>
      {showPopover && (
        <UpdateNicknamePopover
          address={text('address', '0x0011244f50ff4')}
          nickname={text('nickname', 'user_nickname')}
          onClose={() => action(`Close Update Nickname Popover`)()}
        />
      )}
    </div>
  );
};
