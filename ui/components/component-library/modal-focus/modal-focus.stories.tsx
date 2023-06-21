import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import Box from '../../ui/box';

import {
  BorderColor,
  DISPLAY,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';

import { ModalFocus } from './modal-focus';
import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/ModalFocus',
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
} as ComponentMeta<typeof ModalFocus>;

const Template: ComponentStory<typeof ModalFocus> = (args) => {
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
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Children = Template.bind({});
Children.args = {
  children: (
    <>
      <p>Modal focus children</p>
    </>
  ),
};
export const InitialFocusRef = (args) => {
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
};
InitialFocusRef.args = {
  children: <p>Initial focus is on the close button</p>,
};

export const FinalFocusRef = (args) => {
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
};

export const RestoreFocus = (args) => {
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
};

export const AutoFocus = Template.bind({});
AutoFocus.args = {
  autoFocus: false,
  children: <p>auto focus set to false</p>,
};
