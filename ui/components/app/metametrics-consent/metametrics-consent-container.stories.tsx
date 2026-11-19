import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { MetaMetricsConsentContainer } from './metametrics-consent-container';

// The modal only renders once the user has opted in to MetaMetrics but has
// not yet made a marketing data collection decision.
const store = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    consentDecisionMade: true,
    optedIn: true,
    marketingConsentDecisionMade: false,
  },
});

const meta = {
  title: 'Components/App/MetaMetricsConsentContainer',
  component: MetaMetricsConsentContainer,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
} satisfies Meta<typeof MetaMetricsConsentContainer>;

export default meta;
type Story = StoryObj<typeof MetaMetricsConsentContainer>;

export const DefaultStory: Story = {
  name: 'Default',
};
