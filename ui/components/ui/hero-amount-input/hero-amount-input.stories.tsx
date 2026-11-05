import React, { useEffect, useState } from 'react';
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
      <StatefulAmount value="1.5" maxFontSize={40} align="start" />
    </PopupFrame>
  ),
};

const TYPING_SEQUENCE = ['1', '2', '3', '4', '5', '.', '6', '7'];
const TYPING_STEP_MS = 450;

/**
 * Types and then deletes an amount on a loop, one keystroke per step, so the
 * glyph motion can be recorded and compared with Mobile.
 */
const useTypingLoop = (isPlaying: boolean) => {
  const [step, setStep] = useState(0);
  const cycle = TYPING_SEQUENCE.length * 2 + 2;

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }
    const timer = setInterval(
      () => setStep((previous) => (previous + 1) % cycle),
      TYPING_STEP_MS,
    );
    return () => clearInterval(timer);
  }, [cycle, isPlaying]);

  const typed =
    step <= TYPING_SEQUENCE.length
      ? step
      : Math.max(0, TYPING_SEQUENCE.length * 2 + 1 - step);
  return TYPING_SEQUENCE.slice(0, typed).join('');
};

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

const GlyphMotionDemo = ({
  prefix,
  maxFontSize,
  align,
}: Pick<HeroAmountInputProps, 'prefix' | 'maxFontSize' | 'align'>) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const looped = useTypingLoop(isPlaying);
  const [manual, setManual] = useState('');
  const value = isPlaying ? looped : manual;
  const setValue = (next: string) => {
    setIsPlaying(false);
    setManual(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <HeroAmountInput
        prefix={prefix}
        value={value}
        onChange={setValue}
        maxFontSize={maxFontSize}
        align={align}
        data-testid="glyph-motion-demo"
      />
      <div className="grid grid-cols-3 gap-2">
        {KEYPAD_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="rounded bg-muted py-2 text-default"
            onClick={() => setValue(`${value}${key}`)}
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          className="rounded bg-muted py-2 text-default"
          onClick={() => setValue(value.slice(0, -1))}
        >
          ⌫
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded bg-muted py-2 text-default"
          onClick={() => setValue('1234.56')}
        >
          Max
        </button>
        <button
          type="button"
          className="flex-1 rounded bg-muted py-2 text-default"
          onClick={() => setValue('')}
        >
          Clear
        </button>
        <button
          type="button"
          className="flex-1 rounded bg-muted py-2 text-default"
          onClick={() => setIsPlaying((previous) => !previous)}
        >
          {isPlaying ? 'Pause loop' : 'Play loop'}
        </button>
      </div>
    </div>
  );
};

/**
 * Per-glyph motion ported from Mobile `AnimatedNumericText`: new digits zoom
 * in, deleted digits zoom out, and the rest slide as the row re-centers. The
 * loop types and deletes on its own; the keypad or the field takes over.
 * With reduced motion enabled in the OS, the amount updates without motion.
 */
export const GlyphMotion: Story = {
  render: () => (
    <PopupFrame>
      <GlyphMotionDemo prefix="$" />
    </PopupFrame>
  ),
};

export const GlyphMotionSwapField: Story = {
  render: () => (
    <PopupFrame>
      <GlyphMotionDemo maxFontSize={40} align="start" />
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
