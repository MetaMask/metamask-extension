import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ImportSRP from './import-srp';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import type { UITrackEventMethod } from '../../../contexts/metametrics';

const mockTrackEvent: UITrackEventMethod = (event, properties) => {
  console.log('Mock track event:', { event, properties });
  return Promise.resolve();
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MetaMetricsContext.Provider value={mockTrackEvent}>
    {children}
  </MetaMetricsContext.Provider>
);

const meta: Meta<typeof ImportSRP> = {
  title: 'Pages/OnboardingFlow/ImportSRP',
  component: ImportSRP,
  decorators: [
    (Story) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'ImportSRP component allows users to input and submit their Secret Recovery Phrase.',
      },
    },
  },
  argTypes: {
    submitSecretRecoveryPhrase: { action: 'submitSecretRecoveryPhrase' },
  },
};

export default meta;
type Story = StoryObj<typeof ImportSRP>;

export const DefaultStory: Story = {
  args: {
    submitSecretRecoveryPhrase: () =>
      console.log('Secret Recovery Phrase submitted'),
  },
};

DefaultStory.storyName = 'Default';
