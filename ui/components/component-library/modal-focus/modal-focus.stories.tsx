import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import Box from '../../ui/box';

import {
  BorderColor,
  DISPLAY,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';

import { ModalFocus } from './modal-focus';
import README from './README.mdx';

const meta: Meta<typeof ModalFocus> = {
  component: ModalFocus,
  parameters: {
    docs: {
      page: README,
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
};

export default meta;
type Story = StoryObj<typeof ModalFocus>;

export const DefaultStory: Story = {
  name: 'Default',
  render: (args) => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open</button>
        {open && (
          <ModalFocus {...args}>
            <Box
              padding={4}
              borderColor={BorderColor.borderDefault}
              display={DISPLAY.FLEX}
              flexDirection={FLEX_DIRECTION.COLUMN}
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
};

export const Children: Story = {
  args: {
    children: (
      <>
        <p>Modal focus children</p>
      </>
    ),
  },
  render: (args) => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open</button>
        {open && (
          <ModalFocus {...args}>
            <Box
              padding={4}
              borderColor={BorderColor.borderDefault}
              display={DISPLAY.FLEX}
              flexDirection={FLEX_DIRECTION.COLUMN}
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
};

export const InitialFocusRef: Story = {
  args: {
    children: <p>Initial focus is on the close button</p>,
  },
  render: (args) => {
    const ref = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open</button>
        {open && (
          <ModalFocus {...args} initialFocusRef={ref}>
            <Box
              padding={4}
              borderColor={BorderColor.borderDefault}
              display={DISPLAY.FLEX}
              flexDirection={FLEX_DIRECTION.COLUMN}
              gap={4}
            >
              <input />
              {args.children}
              <button ref={ref} onClick={() => setOpen(false)}>
                Close
              </button>
            </Box>
          </ModalFocus>
        )}
      </>
    );
  },
};

export const FinalFocusRef: Story = {
  render: (args) => {
    const ref = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Box display={DISPLAY.FLEX} gap={4}>
          <button onClick={() => setOpen(true)}>Open</button>
          <input placeholder="Focus will return here" ref={ref} />
        </Box>
        {open && (
          <ModalFocus {...args} finalFocusRef={ref}>
            <Box
              padding={4}
              borderColor={BorderColor.borderDefault}
              display={DISPLAY.FLEX}
              flexDirection={FLEX_DIRECTION.COLUMN}
              gap={4}
            >
              <p>Focus will be returned to the input once closed</p>
              <button onClick={() => setOpen(false)}>Close</button>
            </Box>
          </ModalFocus>
        )}
      </>
    );
  },
};

export const RestoreFocus: Story = {
  render: (args) => {
    const ref = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <button ref={ref} onClick={() => setOpen(!open)}>
          Open
        </button>
        {open && (
          <ModalFocus {...args} restoreFocus>
            <Box
              padding={4}
              borderColor={BorderColor.borderDefault}
              display={DISPLAY.FLEX}
              flexDirection={FLEX_DIRECTION.COLUMN}
              gap={4}
            >
              <p>Focus will be restored to the open button once closed</p>
              <button onClick={() => setOpen(false)}>Close</button>
            </Box>
          </ModalFocus>
        )}
      </>
    );
  },
};

export const AutoFocus: Story = {
  args: {
    autoFocus: false,
    children: <p>auto focus set to false</p>,
  },
};
