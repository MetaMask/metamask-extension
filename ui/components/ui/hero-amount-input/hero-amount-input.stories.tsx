import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Box } from '@metamask/design-system-react';

import { HeroAmountInput } from './hero-amount-input';
import type { HeroAmountInputProps } from './hero-amount-input.types';

const PopupFrame = ({
  children,
  className = 'w-[360px]',
}: {
  children: React.ReactNode;
  className?: string;
}) => <Box className={`${className} bg-default p-4`}>{children}</Box>;

const StatefulAmount = (props: HeroAmountInputProps) => {
  const [value, setValue] = useState(props.value);
  return <HeroAmountInput {...props} value={value} onChange={setValue} />;
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

export const MaxDecimals: Story = {
  render: () => (
    <PopupFrame>
      <StatefulAmount prefix="$" value="12.34" maxDecimals={2} />
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

export const ReadOnly: Story = {
  render: () => (
    <PopupFrame>
      <HeroAmountInput prefix="$" value="25" readOnly />
    </PopupFrame>
  ),
};

export const Loading: Story = {
  render: () => (
    <PopupFrame>
      <HeroAmountInput prefix="$" value="25" isLoading />
    </PopupFrame>
  ),
};

export const SwapField: Story = {
  render: () => (
    <PopupFrame>
      <StatefulAmount value="1.5" maxFontSize={48} align="start" />
    </PopupFrame>
  ),
};

export const Wide: Story = {
  render: () => (
    <PopupFrame className="w-[640px]">
      <StatefulAmount prefix="$" value="123456789012" />
    </PopupFrame>
  ),
};
