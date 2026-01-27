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
      <Menu onHide={() => {}}>
        <MenuItem iconName={IconName.Eye} onClick={() => {}}>
          Menu Item 1
        </MenuItem>
        <MenuItem onClick={() => {}}>Menu Item 2</MenuItem>
        <MenuItem iconName={IconName.EyeSlash} onClick={() => {}}>
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
      <Menu anchorElement={anchorElement} onHide={() => {}}>
        <MenuItem iconName={IconName.Export} onClick={() => {}}>
          Menu Item 1
        </MenuItem>
        <MenuItem onClick={() => {}}>Menu Item 2</MenuItem>
        <MenuItem iconName={IconName.EyeSlash} onClick={() => {}}>
          Menu Item 3
        </MenuItem>
        <MenuItem iconName={IconName.AddSquare} onClick={() => {}}>
          Disabled Item
        </MenuItem>
      </Menu>
    </Deprecated>
  );
};
