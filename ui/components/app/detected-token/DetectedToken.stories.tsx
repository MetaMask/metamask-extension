import React from 'react';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { within, fireEvent } from '@storybook/testing-library';
import DetectedToken from './detected-token';
import configureStore from '../../../store/store';
import { tokens as INITIAL_STATE } from '../../../../.storybook/initial-states/approval-screens/add-token';

// Mocking the necessary imports
// Add any additional mock imports required for the component here

const store = configureStore({ metamask: { ...INITIAL_STATE } });

const meta: Meta<typeof DetectedToken> = {
  title: 'UI/Components/App/DetectedToken',
  component: DetectedToken,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
  // Define argTypes here if necessary
  argTypes: {},
};

export default meta;

export const Default: StoryObj<typeof DetectedToken> = {
  // Define args here if necessary
  args: {},
  // Define other story properties if necessary
  play: async ({ canvasElement }) => {
    // Simulate user interactions here
    const canvas = within(canvasElement);
    // Assuming there are buttons for selecting tokens and importing them
    // Replace 'SelectTokenButton' and 'ImportButton' with actual data-testid or roles
    const selectTokenButton = canvas.getByTestId('SelectTokenButton');
    await fireEvent.click(selectTokenButton);
    const importButton = canvas.getByTestId('ImportButton');
    await fireEvent.click(importButton);
    // Add more interactions as necessary
  },
};
