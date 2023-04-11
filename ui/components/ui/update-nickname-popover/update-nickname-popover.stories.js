import { useArgs } from '@storybook/client-api';
import React from 'react';
import Button from '../button';
import README from './README.mdx';
import UpdateNicknamePopover from '.';

export default {
  title: 'Components/UI/UpdateNicknamePopover',

  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    address: {
      control: { type: 'text' },
    },
    showPopover: {
      control: { type: 'boolean' },
    },
    onAdd: { action: 'onAdd' },
    onClose: { action: 'onClose' },
  },
  args: {
    address: '0xdeDbcA0156308960E3bBa2f5a273E72179940788',
    showPopover: false,
  },
};

export const DefaultStory = (args) => {
  const [{ showPopover }, updateArgs] = useArgs();

  const handlePopoverState = () => {
    updateArgs({
      showPopover: !showPopover,
    });
  };

  return (
    <div style={{ width: '600px' }}>
      <Button onClick={handlePopoverState}>Open Update Nickname Popover</Button>
      {showPopover && (
        <UpdateNicknamePopover
          {...args}
          nickname="user_nickname"
          memo="This is a memo"
          onClose={handlePopoverState}
        />
      )}
    </div>
  );
};

DefaultStory.storyName = 'UpdateNickname';

export const AddNickname = (args) => {
  const [{ showPopover }, updateArgs] = useArgs();

  const handlePopoverState = () => {
    updateArgs({
      showPopover: !showPopover,
    });
  };

  return (
    <div style={{ width: '600px' }}>
      <Button onClick={handlePopoverState}>Open Add Nickname Popover</Button>
      {showPopover && (
        <UpdateNicknamePopover {...args} onClose={handlePopoverState} />
      )}
    </div>
  );
};
