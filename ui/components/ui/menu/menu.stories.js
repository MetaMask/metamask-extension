import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';

import Popover from '../popover';
import { Box, Text } from '../../component-library';

export default {
  title: 'Components/UI/Menu (Popover Migration)',
};

export const DefaultStory = () => {
  const [anchorElement, setAnchorElement] = useState(null);
  return (
    <div style={{ padding: '120px' }}>
      <button ref={setAnchorElement}>Anchor</button>

      <Popover referenceElement={anchorElement} onClose={action('Close')}>
        <Box
          role="menuitem"
          tabIndex={0}
          onClick={action('Menu Item 1')}
          style={{ padding: '8px 12px', cursor: 'pointer' }}
        >
          <Text>Menu Item 1</Text>
        </Box>

        <Box
          role="menuitem"
          tabIndex={0}
          onClick={action('Menu Item 2')}
          style={{ padding: '8px 12px', cursor: 'pointer' }}
        >
          <Text>Menu Item 2</Text>
        </Box>
        <Box
          role="menuitem"
          tabIndex={0}
          onClick={action('Menu Item 3')}
          style={{ padding: '8px 12px', cursor: 'pointer' }}
        >
          <Text>Menu Item 3</Text>
        </Box>
      </Popover>
    </div>
  );
};

DefaultStory.storyName = 'Default';

export const Anchored = () => {
  const [anchorElement, setAnchorElement] = useState(null);
  return (
    <>
      <button ref={setAnchorElement}>Open Popover</button>
      {anchorElement && (
        <Popover referenceElement={anchorElement} onClose={action('Close')}>
          <Box padding={2}>
            <Box
              role="menuitem"
              tabIndex={0}
              onClick={action('Item 1')}
              style={{ padding: '8px 12px', cursor: 'pointer' }}
            >
              <Text>Menu Item 1</Text>
            </Box>
            <Box
              role="menuitem"
              tabIndex={0}
              onClick={action('Item 2')}
              style={{ padding: '8px 12px', cursor: 'pointer' }}
            >
              <Text>Menu Item 2</Text>
            </Box>
            <Box
              role="menuitem"
              tabIndex={0}
              onClick={action('Item 3')}
              style={{ padding: '8px 12px', cursor: 'pointer' }}
            >
              <Text>Menu Item 3</Text>
            </Box>
          </Box>
        </Popover>
      )}
    </>
  );
};
