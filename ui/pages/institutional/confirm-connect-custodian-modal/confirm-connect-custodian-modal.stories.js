import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import ConfirmConnectCustodianModal from '.';

const store = configureStore(testData);

export default {
  title: 'Components/Institutional/ConfirmConnectCustodianModal',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: ConfirmConnectCustodianModal,
};

export const DefaultStory = () => (
  <ConfirmConnectCustodianModal
    onModalClose={{}}
    custodianName="Qredo"
    custodianURL="https://qredo.com"
  />
);

DefaultStory.storyName = 'ConfirmConnectCustodianModal';
