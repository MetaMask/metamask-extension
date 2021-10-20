import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { boolean, text } from '@storybook/addon-knobs';

import ToggleButton from './toggle-button.component';

export default {
  title: 'ToggleButton',
  component: ToggleButton,
  id: __filename,
};

export const DefaultStory = () => {
  const [checked, setChecked] = useState(false);
  const handleOnToggle = (e) => {
    action('onToggle')(e);
    setChecked(!checked);
  };
  return (
    <ToggleButton
      offLabel={text('offLabel', 'off')}
      onLabel={text('onLabel', 'on')}
      disabled={boolean('disabled', false)}
      value={checked}
      onToggle={handleOnToggle}
    />
  );
};

DefaultStory.story = {
  name: 'Default',
};
