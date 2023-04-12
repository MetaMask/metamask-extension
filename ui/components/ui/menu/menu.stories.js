import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { IconName } from '../../component-library';
import { Menu, MenuItem } from '.';

export default {
  title: 'Components/UI/Menu',
};

export const DefaultStory = () => {
  return (
    <Menu onHide={action('Hide')}>
      <MenuItem iconName={IconName.Eye} onClick={action('Menu Item 1')}>
        Menu Item 1
      </MenuItem>
      <MenuItem onClick={action('Menu Item 2')}>Menu Item 2</MenuItem>
      <MenuItem iconName={IconName.EyeSlash} onClick={action('Menu Item 3')}>
        Menu Item 3
      </MenuItem>
    </Menu>
  );
};

DefaultStory.storyName = 'Default';

export const Anchored = () => {
  const [anchorElement, setAnchorElement] = useState(null);
  return (
    <>
      <button ref={setAnchorElement}>Menu</button>
      <Menu anchorElement={anchorElement} onHide={action('Hide')}>
        <MenuItem iconName={IconName.Export} onClick={action('Menu Item 1')}>
          Menu Item 1
        </MenuItem>
        <MenuItem onClick={action('Menu Item 2')}>Menu Item 2</MenuItem>
        <MenuItem iconName={IconName.Eye_Slsh} onClick={action('Menu Item 3')}>
          Menu Item 3
        </MenuItem>
      </Menu>
    </>
  );
};
