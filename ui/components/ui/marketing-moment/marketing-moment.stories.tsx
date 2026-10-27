import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { MarketingMoment } from './marketing-moment';

const ArtworkPlaceholder = ({ label }: { label: string }) => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    alignItems={BoxAlignItems.Center}
    justifyContent={BoxJustifyContent.Center}
    gap={2}
    className="size-full max-h-60 min-h-40 rounded-lg border border-muted bg-muted"
  >
    <Icon
      name={IconName.Image}
      size={IconSize.Xl}
      color={IconColor.IconMuted}
    />
    <Text
      variant={TextVariant.BodySm}
      color={TextColor.TextMuted}
      textAlign={TextAlign.Center}
    >
      {label}
    </Text>
  </Box>
);

const meta: Meta<typeof MarketingMoment> = {
  title: 'Components/UI/MarketingMoment',
  component: MarketingMoment,
};

export default meta;
type Story = StoryObj<typeof MarketingMoment>;

export const Default: Story = {
  render: () => (
    <MarketingMoment
      title="Perps are here"
      description="Trade with leverage. The title uses the hero face."
      artwork={<ArtworkPlaceholder label="Artwork" />}
      primaryAction={{ label: 'Get started' }}
      secondaryAction={{ label: 'Not now' }}
    />
  ),
};

export const Examples: Story = {
  render: () => (
    <Box className="grid h-full w-full auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-3">
      <MarketingMoment
        title="Your wallet is ready!"
        artwork={<ArtworkPlaceholder label="Wallet ready artwork" />}
        primaryAction={{ label: 'Open wallet' }}
        secondaryAction={{ label: 'Manage default settings' }}
      />

      <MarketingMoment
        title="Introducing Transaction Shield"
        description="Transact with added confidence with up to $10,000 in protection and 24/7 priority support."
        artwork={<ArtworkPlaceholder label="Transaction Shield artwork" />}
        primaryAction={{ label: 'Start 14-day free trial' }}
        secondaryAction={{ label: 'Learn more' }}
      />

      <MarketingMoment
        title="Get 3% on stablecoins"
        description="Convert your stablecoins to mUSD and earn up to a 3% annualized bonus that you can claim daily. Terms apply."
        artwork={<ArtworkPlaceholder label="mUSD coin artwork" />}
        primaryAction={{ label: 'Get started' }}
        secondaryAction={{ label: 'Not now' }}
      />
    </Box>
  ),
};
