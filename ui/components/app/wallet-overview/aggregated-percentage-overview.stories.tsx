import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  AggregatedPercentageOverview,
  AggregatedMultichainPercentageOverview,
} from './aggregated-percentage-overview';

const store = configureStore(mockState);

const Story = {
  title: 'Components/App/WalletOverview/AggregatedPercentageOverview',
  decorators: [
    (story: () => React.ReactNode) => (
      <Provider store={store}>
        <div style={{ padding: '20px', background: '#f0f0f0' }}>{story()}</div>
      </Provider>
    ),
  ],
};

export default Story;

export const Default = () => <AggregatedPercentageOverview />;

export const Multichain = () => <AggregatedMultichainPercentageOverview />;

export const MultichainPrivacyMode = () => (
  <AggregatedMultichainPercentageOverview privacyMode={true} />
);
