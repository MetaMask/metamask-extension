import React from 'react';
import { render } from '@testing-library/react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { TemplateLoader } from './template-loader';

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

const asItem = (type: string): ActivityListItem =>
  ({
    type,
    chainId: 'stellar:pubnet',
    status: 'success',
    timestamp: 0,
    hash: 'hash',
    data: {},
  }) as unknown as ActivityListItem;

describe('TemplateLoader', () => {
  it('renders nothing when there is no item', () => {
    const { container } = render(<TemplateLoader item={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the asset activation details for an assetActivation item', () => {
    const { getByTestId } = render(
      <TemplateLoader item={asItem('assetActivation')} />,
    );

    expect(getByTestId('asset-activation-details')).toBeInTheDocument();
  });

  it('renders the asset activation details for an assetDeactivation item', () => {
    const { getByTestId } = render(
      <TemplateLoader item={asItem('assetDeactivation')} />,
    );

    expect(getByTestId('asset-activation-details')).toBeInTheDocument();
  });

  it('falls back to the default details for an unknown item type', () => {
    const { getByTestId } = render(
      <TemplateLoader item={asItem('contractInteraction')} />,
    );

    expect(getByTestId('default-details')).toBeInTheDocument();
  });
});
