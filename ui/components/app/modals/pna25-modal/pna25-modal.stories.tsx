import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import Pna25Modal from './pna25-modal';

const storeMock = configureStore({
  metamask: {
    completedOnboarding: true,
    participateInMetaMetrics: true,
    pna25Acknowledged: false,
    remoteFeatureFlags: {
      extensionUxPna25: true,
    },
  },
});

const meta: Meta<typeof Pna25Modal> = {
  title: 'Components/App/Modals/Pna25Modal',
  component: Pna25Modal,
  decorators: [
    (Story) => (
      <Provider store={storeMock}>
        <Story />
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Pna25Modal>;

export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';

