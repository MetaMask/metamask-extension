import React from 'react';
import { Provider } from 'react-redux';

import { getMockPersonalSignConfirmStateForRequest } from '../../../../../../../../test/data/confirmations/helper';
import { SignatureRequestSIWEWithResources } from '../../../../../../../../test/data/confirmations/personal_sign';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';

import SIWESignInfo from './siwe-sign';

const store = configureStore(
  getMockPersonalSignConfirmStateForRequest(SignatureRequestSIWEWithResources),
);

const Story = {
  title: 'Pages/Confirmations/Components/Confirm/Info/PersonalSign/SiweSign',
  component: SIWESignInfo,
  decorators: [
    (story: () => any) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <SIWESignInfo />;

DefaultStory.storyName = 'Default';
