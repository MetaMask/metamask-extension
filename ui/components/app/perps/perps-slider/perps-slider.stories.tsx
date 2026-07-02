import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';

import { PerpsSlider } from './perps-slider';

const meta: Meta<typeof PerpsSlider> = {
  title: 'Components/App/Perps/PerpsSlider',
  component: PerpsSlider,
  parameters: {
    docs: {
      description: {
        component:
          'Perps-specific MUI Slider wrapper with optional header/footer chrome and tick marks.',
      },
    },
  },
  argTypes: {
    min: { control: { type: 'number' } },
    max: { control: { type: 'number' } },
    step: { control: { type: 'number' } },
    value: { control: { type: 'number' } },
    markInterval: { control: { type: 'number' } },
    disabled: { control: 'boolean' },
    onChange: { action: 'onChange' },
    onChangeCommitted: { action: 'onChangeCommitted' },
    onEdit: { action: 'onEdit' },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    value: 50,
    disabled: false,
  },
};

export default meta;

const InteractiveTemplate: StoryFn<typeof PerpsSlider> = (args) => {
  const [value, setValue] = useState(args.value);

  return (
    <div style={{ width: 320, padding: 16 }}>
      <PerpsSlider
        {...args}
        value={value}
        onChange={(event, newValue, activeThumb) => {
          const next = Array.isArray(newValue) ? newValue[0] : newValue;
          setValue(next);
          args.onChange?.(event, newValue, activeThumb);
        }}
        onChangeCommitted={(event, newValue) => {
          args.onChangeCommitted?.(event, newValue);
        }}
        onEdit={
          args.onEdit
            ? () => {
                args.onEdit?.();
              }
            : undefined
        }
      />
    </div>
  );
};

export const DefaultStory = InteractiveTemplate.bind({});
DefaultStory.storyName = 'Default';

export const WithHeaderAndFooter = InteractiveTemplate.bind({});
WithHeaderAndFooter.storyName = 'WithHeaderAndFooter';
WithHeaderAndFooter.args = {
  titleText: 'Amount',
  tooltipText: 'Select a percentage of your balance to use.',
  valueText: '50%',
  titleDetail: 'Max 100%',
  infoText: 'Adjust before confirming',
  onEdit: () => undefined,
};

export const WithTickMarks = InteractiveTemplate.bind({});
WithTickMarks.storyName = 'WithTickMarks';
WithTickMarks.args = {
  min: 1,
  max: 20,
  step: 1,
  value: 5,
  markInterval: 5,
};

export const Disabled = InteractiveTemplate.bind({});
Disabled.args = {
  disabled: true,
  value: 75,
};
