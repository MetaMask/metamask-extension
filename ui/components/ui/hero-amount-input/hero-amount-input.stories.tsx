import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Box } from '@metamask/design-system-react';

import { HeroAmountInput } from './hero-amount-input';
import type { HeroAmountInputProps } from './hero-amount-input.types';

const PopupFrame = ({ children }: { children: React.ReactNode }) => (
  <Box className="w-[360px] bg-default p-4">{children}</Box>
);

const StatefulAmount = (props: HeroAmountInputProps) => {
  const [value, setValue] = useState(props.value);
  return (
    <HeroAmountInput
      {...props}
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
};

const meta: Meta<typeof HeroAmountInput> = {
  title: 'Components/UI/HeroAmountInput',
  component: HeroAmountInput,
};

export default meta;
type Story = StoryObj<typeof HeroAmountInput>;

export const Default: Story = {
  render: () => (
    <PopupFrame>
      <StatefulAmount prefix="$" value="100" />
    </PopupFrame>
  ),
};

export const LongAmount: Story = {
  render: () => (
    <PopupFrame>
      <StatefulAmount prefix="$" value="123456789012" />
    </PopupFrame>
  ),
};

export const CurrencyCode: Story = {
  render: () => (
    <PopupFrame>
      <StatefulAmount prefix="KRW" value="1234567" />
    </PopupFrame>
  ),
};

export const WithError: Story = {
  render: () => (
    <PopupFrame>
      <HeroAmountInput prefix="€" value="500" hasError />
    </PopupFrame>
  ),
};

export const Disabled: Story = {
  render: () => (
    <PopupFrame>
      <HeroAmountInput prefix="$" value="25" disabled />
    </PopupFrame>
  ),
};

export const Wide: Story = {
  render: () => (
    <Box className="w-[640px] bg-default p-4">
      <StatefulAmount prefix="$" value="123456789012" />
    </Box>
  ),
};
