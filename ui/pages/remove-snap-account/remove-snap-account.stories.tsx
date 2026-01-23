import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../store/store';
import testData from '../../../.storybook/test-data';
import RemoveSnapAccount from './remove-snap-account';

const store = configureStore(testData);

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Components/UI/RemoveSnapAccount', // title should follow the folder structure location of the component. Don't use spaces.
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = () => (
  <RemoveSnapAccount
    snapId="npm:@metamask/snap-simple-keyring"
    snapName="Test name"
    publicAddress="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
  />
);

DefaultStory.storyName = 'Default';
