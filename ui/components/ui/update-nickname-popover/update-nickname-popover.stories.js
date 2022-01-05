import React, { useState } from 'react';
import Button from '../button';
import README from './README.mdx';
import UpdateNicknamePopover from '.';

export default {
  title: 'Components/UI/UpdateNickname',
  id: __filename,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    address: { control: 'text' },
    onClose: { action: 'onClose' },
    onAdd: { action: 'onAdd' },
  },
};

const address = '0xdeDbcA0156308960E3bBa2f5a273E72179940788';

export const DefaultStory = (args) => {
  const [showPopover, setShowPopover] = useState(false);
  return (
    <div style={{ width: '600px' }}>
      <Button onClick={() => setShowPopover(true)}>
        Open Update Nickname Popover
      </Button>
      {showPopover && (
        <UpdateNicknamePopover
          {...args}
          nickname="user_nickname"
          memo="This is a memo"
        />
      )}
    </div>
  );
};

DefaultStory.storyName = 'UpdateNickname';

DefaultStory.args = {
  address,
};

export const AddNickname = (args) => {
  const [showPopover, setShowPopover] = useState(false);
  return (
    <div style={{ width: '600px' }}>
      <Button onClick={() => setShowPopover(true)}>
        Open Add Nickname Popover
      </Button>
      {showPopover && <UpdateNicknamePopover {...args} />}
    </div>
  );
};

AddNickname.args = {
  address,
};
