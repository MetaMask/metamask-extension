import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { Menu, MenuItem } from '.';

export default {
  title: 'Menu',
};

export const Basic = () => {
  return (
    <Menu onHide={action('Hide')}>
      <MenuItem iconClassName="fas fa-bullseye" onClick={action('Menu Item 1')}>
        Menu Item 1
      </MenuItem>
      <MenuItem onClick={action('Menu Item 2')}>Menu Item 2</MenuItem>
      <MenuItem iconClassName="fas fa-bold" onClick={action('Menu Item 3')}>
        Menu Item 3
      </MenuItem>
    </Menu>
  );
};

export const Anchored = () => {
  const [anchorElement, setAnchorElement] = useState(null);
  return (
    <>
      <button ref={setAnchorElement}>Menu</button>
      <Menu anchorElement={anchorElement} onHide={action('Hide')}>
        <MenuItem
          iconClassName="fas fa-bullseye"
          onClick={action('Menu Item 1')}
        >
          Menu Item 1
        </MenuItem>
        <MenuItem onClick={action('Menu Item 2')}>Menu Item 2</MenuItem>
        <MenuItem iconClassName="fas fa-bold" onClick={action('Menu Item 3')}>
          Menu Item 3
        </MenuItem>
      </Menu>
    </>
  );
};
