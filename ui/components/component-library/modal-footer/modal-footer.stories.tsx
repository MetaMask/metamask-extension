import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Box, Container, Checkbox, ContainerMaxWidth } from '..';
import {
  BackgroundColor,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { ModalFooter } from './modal-footer';

import README from './README.mdx';

const meta: Meta<typeof ModalFooter> = {
  title: 'Components/ComponentLibrary/ModalFooter',
  component: ModalFooter,
  parameters: {
    docs: {
      page: README,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalFooter>;

export const DefaultStory: Story = {
  argTypes: {
    className: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    submitButtonProps: {
      control: 'object',
    },
    onSubmit: {
      action: 'onSubmit',
    },
    cancelButtonProps: {
      control: 'object',
    },
    onCancel: {
      action: 'onCancel',
    },
  },
};

DefaultStory.storyName = 'Default';

export const OnSubmit: Story = {
  argTypes: {
    onSubmit: {
      action: 'onSubmit',
    },
  },
  render: (args) => <ModalFooter {...args} />,
};

export const OnCancel: Story = {
  argTypes: {
    onCancel: {
      action: 'onCancel',
    },
  },
  render: (args) => <ModalFooter {...args} />,
};

export const SubmitButtonPropsCancelButtonProps: Story = {
  argTypes: {
    onSubmit: {
      action: 'onSubmit',
    },
    onCancel: {
      action: 'onCancel',
    },
  },
  args: {
    submitButtonProps: {
      children: 'I want to approve',
    },
    cancelButtonProps: {
      children: 'Cancel this',
    },
  },
};

export const ContainerProps: Story = {
  argTypes: {
    onCancel: {
      action: 'onCancel',
    },
    onSubmit: {
      action: 'onSubmit',
    },
  },
  args: {
    containerProps: {
      maxWidth: null,
    },
  },
  render: (args) => {
    return (
      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
        <ModalFooter
          {...args}
          containerProps={{
            maxWidth: ContainerMaxWidth.Md,
            backgroundColor: BackgroundColor.errorMuted,
          }}
          backgroundColor={BackgroundColor.primaryMuted}
        />
        <ModalFooter
          {...args}
          containerProps={{
            maxWidth: ContainerMaxWidth.Lg,
            backgroundColor: BackgroundColor.errorMuted,
          }}
          backgroundColor={BackgroundColor.primaryMuted}
        />
        <ModalFooter
          {...args}
          containerProps={{
            maxWidth: null,
            backgroundColor: BackgroundColor.errorMuted,
          }}
          backgroundColor={BackgroundColor.primaryMuted}
        />
      </Box>
    );
  },
};

export const Children: Story = {
  argTypes: {
    onCancel: {
      action: 'onCancel',
    },
    onSubmit: {
      action: 'onSubmit',
    },
  },
  args: {
    children: 'Lorem ipsum dolor sit ',
  },
  render: (args) => {
    const [checked, setChecked] = React.useState(false);
    const handleCheckboxChange = () => setChecked(!checked);
    return (
      <ModalFooter {...args}>
        <Container
          maxWidth={ContainerMaxWidth.Sm}
          marginLeft="auto"
          marginRight="auto"
          marginBottom={4}
        >
          <Checkbox
            label="I agree to the terms and conditions"
            isChecked={checked}
            onChange={handleCheckboxChange}
          />
        </Container>
      </ModalFooter>
    );
  },
};
