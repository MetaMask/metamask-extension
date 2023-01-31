import React, { useState } from 'react';
import Button from '../button';
import NicknamePopover from '.';

export default {
  title: 'Components/UI/NicknamePopover',

  argTypes: {
    address: {
      control: { type: 'text' },
      name: 'Address',
    },
    onClosePopover: {
      action: 'Close Nickname Popover',
    },
    onAdd: {
      action: 'Add Nickname Popover',
    },
    onOpenPopover: {
      action: 'Open Nickname Popover',
    },
  },
  args: {
    address: '0x5e6DaAD1BE117e26590F9eEcD509336ABFBe5966',
  },
};

export const DefaultStory = (args) => {
  const [showNicknamePopover, setShowNicknamePopover] = useState(false);

  return (
    <>
      <Button
        onClick={() => {
          args.onOpenPopover();
          setShowNicknamePopover(true);
        }}
      >
        Open Nickname Popover
      </Button>
      {showNicknamePopover && (
        <NicknamePopover
          address={args.address}
          onClose={() => {
            args.onClosePopover();
            setShowNicknamePopover(false);
          }}
          onAdd={args.onAdd}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';
