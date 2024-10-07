import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { getMockTokenTransferConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import SendHeading from './send-heading';

const store = configureStore(getMockTokenTransferConfirmState({}));

const Story = {
  title: 'Components/App/Confirm/info/SendHeading',
  component: SendHeading,
  decorators: [
    (story: () => Meta<typeof SendHeading>) => (
      <Provider store={store}>{story()}</Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <SendHeading />;

DefaultStory.storyName = 'Default';
