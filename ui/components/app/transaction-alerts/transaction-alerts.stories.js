import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep } from 'lodash';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import TransactionAlerts from '.';

// simulate gas fee state
const customStore = ({ supportsEIP1559, isNetworkBusy }) => {
  const data = cloneDeep({
    ...testData,
    metamask: {
      ...testData?.metamask,
      gasFeeEstimates: {
        ...testData.metamask?.gasFeeEstimates,
        networkCongestion: isNetworkBusy ? 1 : 0.1,
      },
      networkDetails: {
        ...testData?.metamask?.networkDetails,
        EIPS: {
          ...testData?.metamask?.networkDetails?.EIPS,
          1159: Boolean(supportsEIP1559),
        },
      },
    },
  });
  return configureStore(data);
};

const customTransaction = ({ estimateUsed, hasSimulationError }) => ({
  simulationFails: Boolean(hasSimulationError),
  userFeeLevel: estimateUsed ? 'low' : 'medium',
});

export default {
  title: 'Components/App/TransactionAlerts',
  argTypes: {
    userAcknowledgedGasMissing: {
      control: 'boolean',
    },
  },
  args: {
    userAcknowledgedGasMissing: false,
  },
};

export const DefaultStory = (args) => (
  <Provider store={customStore({ isNetworkBusy: true, supportsEIP1559: true })}>
    <GasFeeContextProvider
      transaction={customTransaction({
        hasSimulationError: true,
        estimateUsed: true,
      })}
    >
      <TransactionAlerts {...args} />
    </GasFeeContextProvider>
  </Provider>
);

DefaultStory.storyName = 'Default';
