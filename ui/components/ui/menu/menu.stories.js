import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconName, BannerAlert } from '../../component-library';
import { Severity } from '../../../helpers/constants/design-system';
import { Menu, MenuItem } from '.';

export default {
  title: 'Components/UI/Menu',
};

const Deprecated = ({ children }) => (
  <>
    <BannerAlert
      severity={Severity.Warning}
      title="Deprecated"
      description="<Menu/> has been deprecated in favor of <Popover/>"
      marginBottom={4}
    />
    {children}
  </>
);

Deprecated.propTypes = {
  children: PropTypes.node,
};

export const DefaultStory = () => {
  return (
    <Deprecated>
      <Menu
        onHide={() => {
          /* no-op */
        }}
      >
        <MenuItem
          iconName={IconName.Eye}
          onClick={() => {
            /* no-op */
          }}
        >
          Menu Item 1
        </MenuItem>
        <MenuItem
          onClick={() => {
            /* no-op */
          }}
        >
          Menu Item 2
        </MenuItem>
        <MenuItem
          iconName={IconName.EyeSlash}
          onClick={() => {
            /* no-op */
          }}
        >
          Menu Item 3
        </MenuItem>
      </Menu>
    </Deprecated>
  );
};

DefaultStory.storyName = 'Default';

export const Anchored = () => {
  const [anchorElement, setAnchorElement] = useState(null);
  return (
    <Deprecated>
      <button ref={setAnchorElement}>Menu</button>
      <Menu
        anchorElement={anchorElement}
        onHide={() => {
          /* no-op */
        }}
      >
        <MenuItem
          iconName={IconName.Export}
          onClick={() => {
            /* no-op */
          }}
        >
          Menu Item 1
        </MenuItem>
        <MenuItem
          onClick={() => {
            /* no-op */
          }}
        >
          Menu Item 2
        </MenuItem>
        <MenuItem
          iconName={IconName.EyeSlash}
          onClick={() => {
            /* no-op */
          }}
        >
          Menu Item 3
        </MenuItem>
        <MenuItem
          iconName={IconName.AddSquare}
          onClick={() => {
            /* no-op */
          }}
        >
          Disabled Item
        </MenuItem>
      </Menu>
    </Deprecated>
  );
};
