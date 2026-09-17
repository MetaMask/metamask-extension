import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { Provider, Quote } from '@metamask/ramps-controller';
import {
  Box,
  BoxFlexDirection,
  TagSeverity,
} from '@metamask/design-system-react';
import RampsProviderListItem from './ramps-provider-list-item';

const provider = {
  id: '/providers/revolut',
  name: 'Revolut',
} as unknown as Provider;

const moonpay = {
  id: '/providers/moonpay',
  name: 'MoonPay',
} as unknown as Provider;

const stripe = {
  id: '/providers/stripe',
  name: 'Stripe',
} as unknown as Provider;

const quote = {
  provider: provider.id,
  quote: {
    amountIn: 300,
    amountOut: '0.14235',
    paymentMethod: 'debit-credit-card',
    amountOutInFiat: 300.02,
  },
} as unknown as Quote;

const moonpayQuote = {
  provider: moonpay.id,
  quote: {
    amountIn: 300,
    amountOut: '0.14185',
    paymentMethod: 'debit-credit-card',
    amountOutInFiat: 298.96,
  },
} as unknown as Quote;

const stripeQuote = {
  provider: stripe.id,
  quote: {
    amountIn: 300,
    amountOut: '0.13842',
    paymentMethod: 'debit-credit-card',
    amountOutInFiat: 291.71,
  },
} as unknown as Quote;

const meta: Meta<typeof RampsProviderListItem> = {
  title: 'Pages/Ramps/ProviderSelection/RampsProviderListItem',
  component: RampsProviderListItem,
  argTypes: {
    provider: { control: 'object' },
    tag: { control: 'object' },
    quote: { control: 'object' },
    isSelected: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    quoteLoading: { control: 'boolean' },
    currency: { control: 'text' },
    tokenSymbol: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof RampsProviderListItem>;

export const BestRate: Story = {
  args: {
    provider,
    tag: { label: 'Best rate', severity: TagSeverity.Success },
    showQuote: true,
    quote,
    currency: 'EUR',
    tokenSymbol: 'ETH',
    onClick: () => undefined,
  },
};

export const MostReliable: Story = {
  args: {
    provider: moonpay,
    tag: { label: 'Most reliable', severity: TagSeverity.Neutral },
    showQuote: true,
    quote: moonpayQuote,
    currency: 'EUR',
    tokenSymbol: 'ETH',
    onClick: () => undefined,
  },
};

export const NoTag: Story = {
  args: {
    provider: stripe,
    showQuote: true,
    quote: stripeQuote,
    currency: 'EUR',
    tokenSymbol: 'ETH',
    onClick: () => undefined,
  },
};

export const ProviderRows: Story = {
  render: () => (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="w-[600px] p-4 gap-2"
    >
      <RampsProviderListItem
        provider={provider}
        tag={BestRate.args?.tag ?? null}
        showQuote
        quote={quote}
        currency="EUR"
        tokenSymbol="ETH"
        onClick={() => undefined}
      />
      <RampsProviderListItem
        provider={moonpay}
        tag={MostReliable.args?.tag ?? null}
        showQuote
        quote={moonpayQuote}
        currency="EUR"
        tokenSymbol="ETH"
        onClick={() => undefined}
      />
      <RampsProviderListItem
        provider={stripe}
        showQuote
        quote={stripeQuote}
        currency="EUR"
        tokenSymbol="ETH"
        onClick={() => undefined}
      />
    </Box>
  ),
};
