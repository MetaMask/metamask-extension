import { Provider } from 'react-redux';
import React from 'react';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { ClaimsProvider } from '../../../../contexts/claims/claims';
import ClaimsForm from './claims-form';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    claimsConfigurations: {
      validSubmissionWindowDays: 10,
      supportedNetworks: ['0x1', '0x5'],
    },
    drafts: [],
  },
});

export default {
  title: 'Pages/Settings/TransactionShieldTab/ClaimsForm',
  component: ClaimsForm,
  decorators: [
    (story: () => React.ReactNode) => (
      <Provider store={store}>
        <ClaimsProvider>{story()}</ClaimsProvider>
      </Provider>
    ),
  ],
};

export const DefaultStory = () => <ClaimsForm />;

DefaultStory.storyName = 'Default';
