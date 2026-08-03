import React from 'react';
import { render } from '@testing-library/react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { useRampsDetailsItem } from './ramps/hooks';
import { TemplateLoader } from './template-loader';

jest.mock('../components/header', () => ({
  Header: ({ item }: { item?: { type?: string } }) => (
    <div data-testid="header" data-item-type={item?.type} />
  ),
}));
jest.mock('./asset-activation-details', () => ({
  AssetActivationDetails: () => <div data-testid="asset-activation-details" />,
}));
jest.mock('./default-details', () => ({
  DefaultDetails: () => <div data-testid="default-details" />,
}));
jest.mock('./approval-details', () => ({
  ApprovalDetails: () => <div data-testid="approval-details" />,
}));
jest.mock('./send-details', () => ({
  SendDetails: () => <div data-testid="send-details" />,
}));
jest.mock('./bridge-details/bridge-details', () => ({
  BridgeDetails: () => <div data-testid="bridge-details" />,
}));
jest.mock('./swap-details', () => ({
  SwapDetails: () => <div data-testid="swap-details" />,
}));
jest.mock('./nft-details', () => ({
  NftDetails: () => <div data-testid="nft-details" />,
}));
jest.mock('./perps-deposit-details', () => ({
  PerpsDepositDetails: () => <div data-testid="perps-deposit-details" />,
}));
jest.mock('./perps-details', () => ({
  PerpsDetails: () => <div data-testid="perps-details" />,
}));
jest.mock('./ramps/ramp-order-details', () => ({
  RampOrderDetails: () => <div data-testid="ramp-order-details" />,
}));
jest.mock('./ramps/hooks', () => ({
  useRampsDetailsItem: jest.fn(),
}));
jest.mock('./convert-details', () => ({
  ConvertDetails: () => <div data-testid="convert-details" />,
}));

const mockUseRampsDetailsItem = jest.mocked(useRampsDetailsItem);

const asItem = (type: string): ActivityListItem =>
  ({
    type,
    chainId: 'stellar:pubnet',
    status: 'success',
    timestamp: 0,
    hash: 'hash',
    data: {},
  }) as unknown as ActivityListItem;

const defaultProps = {
  chainId: 'eip155:1' as string | undefined,
  txIdentifier: '0xabc' as string | undefined,
  onBack: jest.fn(),
};

describe('TemplateLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRampsDetailsItem.mockReturnValue(undefined);
  });

  it('renders the header with no body when there is no item', () => {
    const { getByTestId, queryByTestId } = render(
      <TemplateLoader item={undefined} {...defaultProps} />,
    );

    expect(getByTestId('header')).toBeInTheDocument();
    expect(queryByTestId('default-details')).not.toBeInTheDocument();
  });

  it('prefers a mapped ramps order over the generic item', () => {
    mockUseRampsDetailsItem.mockReturnValue({
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1,
      data: { id: 'order-1' },
    } as never);

    const { getByTestId } = render(
      <TemplateLoader item={asItem('send')} {...defaultProps} />,
    );

    expect(getByTestId('ramp-order-details')).toBeInTheDocument();
    expect(getByTestId('header')).toHaveAttribute('data-item-type', 'rampBuy');
  });

  it('renders the asset activation details for an assetActivation item', () => {
    const { getByTestId } = render(
      <TemplateLoader item={asItem('assetActivation')} {...defaultProps} />,
    );

    expect(getByTestId('asset-activation-details')).toBeInTheDocument();
  });

  it('renders the asset activation details for an assetDeactivation item', () => {
    const { getByTestId } = render(
      <TemplateLoader item={asItem('assetDeactivation')} {...defaultProps} />,
    );

    expect(getByTestId('asset-activation-details')).toBeInTheDocument();
  });

  it('renders the ramp order details for a rampBuy item', () => {
    const { getByTestId } = render(
      <TemplateLoader item={asItem('rampBuy')} {...defaultProps} />,
    );

    expect(getByTestId('ramp-order-details')).toBeInTheDocument();
  });

  it('renders the ramp order details for a rampSell item', () => {
    const { getByTestId } = render(
      <TemplateLoader item={asItem('rampSell')} {...defaultProps} />,
    );

    expect(getByTestId('ramp-order-details')).toBeInTheDocument();
  });

  it('falls back to the default details for an unknown item type', () => {
    const { getByTestId } = render(
      <TemplateLoader item={asItem('contractInteraction')} {...defaultProps} />,
    );

    expect(getByTestId('default-details')).toBeInTheDocument();
  });
});
