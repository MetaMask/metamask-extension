import * as React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react';
import configureStore from '../../store/store';
import { SamplePage } from './sample-page';
import mockState from '../../../test/data/mock-state.json';

// Create a mock store with the mockState
const storeMock = configureStore(mockState);

const meta: Meta<typeof SamplePage> = {
  title: 'Pages/SamplePage',
  component: SamplePage,
  // Use decorators to wrap the component with necessary providers
  decorators: [
    (Story) => (
      <Provider store={storeMock}>
        <MemoryRouter>{Story()}</MemoryRouter>
      </Provider>
    ),
  ],
  parameters: {
    // Optional parameters
    docs: {
      description: {
        component:
          'A sample page demonstrating how to build a feature end-to-end in MetaMask.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SamplePage>;

// Default story
export const Default: Story = {
  args: {},
};
