import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import mockState from '../../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../../store/store';
import { SendHeading } from './send-heading';

function getStore() {
  return configureStore(mockState);
}

const Story = {
  title: 'Components/App/Confirm/info/SendHeading',
  component: SendHeading,
  decorators: [
    (story: () => Meta<typeof SendHeading>) => (
      <Provider store={getStore()}>
        <div
          style={{
            backgroundColor: 'var(--color-background-alternative)',
            padding: 30,
          }}
        >
          {story()}
        </div>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <SendHeading />;

DefaultStory.storyName = 'Default';
