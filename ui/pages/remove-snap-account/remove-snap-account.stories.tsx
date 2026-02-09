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
    snapId="npm:@metamask/test-snap-bip44"
    snapName="BIP-44"
    publicAddress="0xde939393DDe455081fFb3Dfd027E189919F04BD0"
    onCancel={() => {}}
  />
);

DefaultStory.storyName = 'Default';
