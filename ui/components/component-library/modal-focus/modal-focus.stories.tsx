import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Box,
  BoxFlexDirection,
  BoxBorderColor,
} from '@metamask/design-system-react';

import { ModalFocus } from './modal-focus';

type ModalFocusProps = React.ComponentProps<typeof ModalFocus>;

export default {
  title: 'Components/ComponentLibrary/ModalFocus (deprecated)',
  component: ModalFocus,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [ModalFocus from @metamask/design-system-react] instead.',
      },
    },
  },
  args: {
    children: (
      <>
        <p>Modal focus children</p>
        <input />
        <p>
          Use the keyboard to try tabbing around you will notice that the focus
          is locked to the content within modal focus
        </p>
      </>
    ),
  },
} satisfies Meta<typeof ModalFocus>;

export const DefaultStory: StoryObj<typeof ModalFocus> = {
  render: (args: ModalFocusProps) => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open</button>
        {open && (
          <ModalFocus {...args}>
            <Box
              padding={4}
              borderColor={BoxBorderColor.BorderDefault}
              flexDirection={BoxFlexDirection.Column}
              gap={4}
            >
              {args.children}
              <button onClick={() => setOpen(false)}>Close</button>
            </Box>
          </ModalFocus>
        )}
      </>
    );
  },
  name: 'Default',
};
