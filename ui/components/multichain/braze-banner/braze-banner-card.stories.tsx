import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrazeBannerCard } from './braze-banner-card';

const meta: Meta<typeof BrazeBannerCard> = {
  title: 'Components/Multichain/BrazeBannerCard',
  component: BrazeBannerCard,
  args: {
    title: 'Explore MetaMask',
    body: 'Discover what is new in your wallet.',
    imageUrl: null,
    ctaLabel: 'Learn more',
    onClick: () => undefined,
    onDismiss: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof BrazeBannerCard>;
export const WithTitle: Story = {};
export const WithCta: Story = { args: { title: null } };
export const WithoutLink: Story = { args: { onClick: undefined } };
