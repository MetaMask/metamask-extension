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
    onClose: { action: 'Close Update Nickname Popover' },
    onAdd: { action: 'Submit Nickname' },
  },
};

const address = '0x0011244f50ff4';

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
