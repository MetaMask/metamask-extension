import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import configureStore from '../../../store/store';
import ShieldEntryModal from './shield-entry-modal';
import mockState from '../../../../test/data/mock-state.json';

const store = configureStore(mockState);

const meta = {
  title: 'Components/App/ShieldEntryModal',
  component: ShieldEntryModal,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
} satisfies Meta<typeof ShieldEntryModal>;

export default meta;
type Story = StoryObj<typeof ShieldEntryModal>;

export const DefaultStory: Story = {
  name: 'Default',
};
