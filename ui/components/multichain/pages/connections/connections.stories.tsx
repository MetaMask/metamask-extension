import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import { Meta, StoryObj } from '@storybook/react';
import { Connections } from './connections';
import configureStore from '../../../../store/store';
import state from '../../../../../.storybook/test-data';

const store = configureStore(state);

const meta = {
  title: 'Components/Multichain/Pages/Connections',
  component: Connections,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <MemoryRouter initialEntries={['/connections/metamask.github.io']}>
          <Route path="/connections/:origin">
            <Story />
          </Route>
        </MemoryRouter>
      </Provider>
    ),
  ],
} satisfies Meta<typeof Connections>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
