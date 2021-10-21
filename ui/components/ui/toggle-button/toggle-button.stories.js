import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { boolean, text } from '@storybook/addon-knobs';

import ToggleButton from './toggle-button.component';

export default {
  title: 'UI/Toggle/Button',
  component: ToggleButton,
  id: __filename,
};

export const Base = () => {
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
