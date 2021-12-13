import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { text } from '@storybook/addon-knobs';
import Button from '../button';
import NicknamePopover from '.';

export default {
  title: 'Components/UI/NicknamePopover',
  id: __filename,
};

export const DefaultStory = () => {
  const [showNicknamePopover, setShowNicknamePopover] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowNicknamePopover(true)}>
        Open Nickname Popover
      </Button>
      {showNicknamePopover && (
        <NicknamePopover
          address={text(
            'Address',
            '0x5e6DaAD1BE117e26590F9eEcD509336ABFBe5966',
          )}
          onClose={() => setShowNicknamePopover(false)}
          onAdd={action('add NicknamePopover')}
        />
      )}
    </div>
  );
};

DefaultStory.storyName = 'Default';
