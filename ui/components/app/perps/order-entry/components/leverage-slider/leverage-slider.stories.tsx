import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';

import { MetaMetricsContext } from '../../../../../../contexts/metametrics';
import { LeverageSlider } from './leverage-slider';

const mockMetaMetricsContext = {
  trackEvent: () => Promise.resolve(undefined),
  bufferedTrace: () => Promise.resolve(undefined),
  bufferedEndTrace: () => undefined,
  onboardingParentContext: { current: null },
};

const meta: Meta<typeof LeverageSlider> = {
  title: 'Components/App/Perps/LeverageSlider',
  component: LeverageSlider,
  decorators: [
    (Story) => (
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <div style={{ width: 360, padding: 16 }}>
          <Story />
        </div>
      </MetaMetricsContext.Provider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Leverage multiplier slider with numeric input, built on PerpsSlider.',
      },
    },
  },
  argTypes: {
    leverage: { control: { type: 'number', min: 1 } },
    maxLeverage: { control: { type: 'number', min: 1 } },
    minLeverage: { control: { type: 'number', min: 1 } },
    onLeverageChange: { action: 'onLeverageChange' },
  },
  args: {
    leverage: 1,
    maxLeverage: 20,
    minLeverage: 1,
  },
};

export default meta;

const InteractiveTemplate: StoryFn<typeof LeverageSlider> = (args) => {
  const [leverage, setLeverage] = useState(args.leverage);

  return (
    <LeverageSlider
      {...args}
      leverage={leverage}
      onLeverageChange={(next) => {
        setLeverage(next);
        args.onLeverageChange?.(next);
      }}
    />
  );
};

export const DefaultStory = InteractiveTemplate.bind({});
DefaultStory.storyName = 'Default';

export const MidLeverage = InteractiveTemplate.bind({});
MidLeverage.storyName = 'MidLeverage';
MidLeverage.args = {
  leverage: 10,
};

export const HighMaxLeverage = InteractiveTemplate.bind({});
HighMaxLeverage.storyName = 'HighMaxLeverage';
HighMaxLeverage.args = {
  leverage: 25,
  maxLeverage: 50,
};
