import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Box from '../../ui/box';

import {
  BorderColor,
  DISPLAY,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';

import { ModalFocus } from './modal-focus';

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
