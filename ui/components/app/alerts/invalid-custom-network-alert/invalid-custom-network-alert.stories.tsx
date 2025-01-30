import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import InvalidCustomNetworkAlert from './invalid-custom-network-alert';
import { ALERT_STATE } from '../../../../ducks/alerts';

const mockStore = configureStore([]);
const store = mockStore({
  invalidCustomNetwork: {
    state: ALERT_STATE.ERROR,
    networkName: 'Test Network',
  },
});

const meta: Meta<typeof InvalidCustomNetworkAlert> = {
  title: 'Components/App/Alerts/InvalidCustomNetworkAlert',
  component: InvalidCustomNetworkAlert,
  parameters: {},
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
  argTypes: {
    history: {
      control: 'object',
    },
  },
  args: {
    history: {
      push: () => {},
    },
  },
};

export default meta;
type Story = StoryObj<typeof InvalidCustomNetworkAlert>;

export const DefaultStory: Story = {
  render: (args) => <InvalidCustomNetworkAlert {...args} />,
};

DefaultStory.storyName = 'Default';
