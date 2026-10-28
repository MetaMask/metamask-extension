import React from 'react';
import { render } from '@testing-library/react';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/lib/selectors/networks';
import { getImageForChainId } from '../../../../selectors/multichain';
import { BridgeNetworkRow } from './bridge-network-row';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  // The component only reads mocked selectors, so state is irrelevant here.
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('@metamask/design-system-react', () => ({
  AvatarNetwork: ({ name, src }: { name: string; src?: string }) => (
    <div data-testid="avatar-network" data-name={name} data-src={src ?? ''} />
  ),
  AvatarNetworkSize: { Xs: 'Xs' },
}));

jest.mock('../../../../../shared/lib/selectors/networks', () => ({
  getAllNetworkConfigurationsByCaipChainId: jest.fn(() => ({})),
}));

jest.mock('../../../../selectors/multichain', () => ({
  getImageForChainId: jest.fn(),
}));

const mockGetAllNetworkConfigurationsByCaipChainId =
  getAllNetworkConfigurationsByCaipChainId as unknown as jest.Mock;
const mockGetImageForChainId = getImageForChainId as unknown as jest.Mock;

describe('BridgeNetworkRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllNetworkConfigurationsByCaipChainId.mockReturnValue({});
    mockGetImageForChainId.mockImplementation(
      (chainId: string) => `img:${chainId}`,
    );
  });

  it('renders the configured network names for both chains', () => {
    mockGetAllNetworkConfigurationsByCaipChainId.mockReturnValue({
      'eip155:1': { name: messages.networkNameEthereum.message },
      'eip155:137': { name: messages.networkNamePolygon.message },
    });

    const { getByText } = render(
      <BridgeNetworkRow fromChainId="eip155:1" toChainId="eip155:137" />,
    );

    expect(getByText(messages.networkNameEthereum.message)).toBeInTheDocument();
    expect(getByText(messages.networkNamePolygon.message)).toBeInTheDocument();
    expect(getByText('→')).toBeInTheDocument();
  });

  it('falls back to the chain id when the network is not configured', () => {
    const { getByText } = render(
      <BridgeNetworkRow fromChainId="eip155:1" toChainId="eip155:137" />,
    );

    expect(getByText('eip155:1')).toBeInTheDocument();
    expect(getByText('eip155:137')).toBeInTheDocument();
  });

  it('resolves EVM network images from the hex chain id', () => {
    const { getAllByTestId } = render(
      <BridgeNetworkRow fromChainId="eip155:1" toChainId="eip155:137" />,
    );

    expect(mockGetImageForChainId).toHaveBeenCalledWith('0x1');
    expect(mockGetImageForChainId).toHaveBeenCalledWith('0x89');

    const [fromAvatar, toAvatar] = getAllByTestId('avatar-network');
    expect(fromAvatar).toHaveAttribute('data-src', 'img:0x1');
    expect(toAvatar).toHaveAttribute('data-src', 'img:0x89');
  });

  it('resolves non-EVM network images from the caip chain id', () => {
    const nonEvmChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

    render(
      <BridgeNetworkRow fromChainId={nonEvmChainId} toChainId="eip155:1" />,
    );

    expect(mockGetImageForChainId).toHaveBeenCalledWith(nonEvmChainId);
    expect(mockGetImageForChainId).toHaveBeenCalledWith('0x1');
  });
});
