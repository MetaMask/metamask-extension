import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import configureStore from '../../../../store/store';
import { SnapUICheckbox } from './snap-ui-checkbox';
import { SnapInterfaceContextProvider } from '../../../../contexts/snaps';
import testData from '../../../../../.storybook/test-data';

// Create mock store with test data (following pattern from other snap stories)
const store = configureStore(testData);

// Create a wrapper component that provides both Redux and SnapInterface context
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <SnapInterfaceContextProvider
      snapId="npm:@metamask/test-snap-bip44"
      interfaceId="test-interface"
      initialState={{}}
      context={{}}
    >
      {children}
    </SnapInterfaceContextProvider>
  </Provider>
);

// Define the metadata for the component
const meta: Meta<typeof SnapUICheckbox> = {
  title: 'Components/App/Snaps/SnapUiCheckbox',
  component: SnapUICheckbox,
  parameters: {
    docs: {
      description: {
        component: 'A customizable checkbox component that supports both checkbox and toggle variants.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
  // Define common argTypes for the component
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'toggle'],
      description: 'The visual style of the checkbox',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    error: {
      control: 'text',
      description: 'Error message to display below the checkbox',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SnapUICheckbox>;

// Default checkbox story
export const Default: Story = {
  args: {
    name: 'default-checkbox',
    label: 'Accept terms and conditions',
  },
};

// Checkbox with field label
export const WithFieldLabel: Story = {
  args: {
    name: 'checkbox-with-field',
    fieldLabel: 'Terms of Service',
    label: 'I agree to the terms and conditions',
  },
};

// Toggle variant story
export const Toggle: Story = {
  args: {
    name: 'toggle-switch',
    variant: 'toggle',
    label: 'Enable notifications',
  },
};

// Disabled state story
export const Disabled: Story = {
  args: {
    name: 'disabled-checkbox',
    label: 'Disabled checkbox',
    disabled: true,
  },
};

// Error state story
export const WithError: Story = {
  args: {
    name: 'error-checkbox',
    label: 'Required checkbox',
    error: 'This field is required',
  },
};

// Toggle with field label story
export const ToggleWithFieldLabel: Story = {
  args: {
    name: 'toggle-with-field',
    variant: 'toggle',
    fieldLabel: 'Notification Settings',
    label: 'Push notifications',
  },
};