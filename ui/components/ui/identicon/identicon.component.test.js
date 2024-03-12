import React from 'react';
import configureMockStore from 'redux-mock-store';
import { toChecksumAddress } from 'ethereumjs-util';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { getNftContractsOnCurrentChain } from '../../../ducks/metamask/metamask';
import { getTokenList } from '../../../selectors';
import Identicon from '.';

jest.mock('../../../selectors', () => ({
  ...jest.requireActual('../../../selectors'),
  getTokenList: jest.fn(),
}));

jest.mock('../../../ducks/metamask/metamask', () => ({
  ...jest.requireActual('../../../ducks/metamask/metamask'),
  getNftContractsOnCurrentChain: jest.fn(),
}));

jest.mock('ethereumjs-util', () => ({
  ...jest.requireActual('ethereumjs-util'),
  toChecksumAddress: jest.fn(),
}));

const ADDRESS_MOCK = '0x0000000000000000000000000000000000000000';
const ADDRESS_NORMALIZED_MOCK = '0x0000000000000000000000000000000000000001';

const mockState = {
  metamask: {
    providerConfig: {
      chainId: '0x99',
    },
    useBlockie: false,
  },
};

const mockStore = configureMockStore()(mockState);

describe('Identicon', () => {
  const getTokenListMock = jest.mocked(getTokenList);
  const getNftContractsOnCurrentChainMock = jest.mocked(
    getNftContractsOnCurrentChain,
  );
  const toChecksumAddressMock = jest.mocked(toChecksumAddress);

  beforeEach(() => {
    jest.resetAllMocks();
    getNftContractsOnCurrentChainMock.mockReturnValue({});
    toChecksumAddressMock.mockReturnValue(ADDRESS_NORMALIZED_MOCK);
  });

  it('should match snapshot with default props', () => {
    const { container } = renderWithProvider(<Identicon />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with custom image and className props', () => {
    const props = {
      className: 'test-image',
      image: 'test-image',
    };

    const { container } = renderWithProvider(
      <Identicon {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with address prop div', () => {
    const props = {
      className: 'test-address',
      address: ADDRESS_MOCK,
    };

    const { container } = renderWithProvider(
      <Identicon {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with token icon', () => {
    const props = {
      className: 'test-address',
      address: ADDRESS_MOCK,
    };

    getTokenListMock.mockReturnValue({
      [ADDRESS_MOCK]: {
        iconUrl: 'https://test.com/testTokenIcon.jpg',
      },
    });

    const { container } = renderWithProvider(
      <Identicon {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with watched NFT logo', () => {
    const props = {
      className: 'test-address',
      address: ADDRESS_MOCK,
    };

    getNftContractsOnCurrentChainMock.mockReturnValue({
      [ADDRESS_NORMALIZED_MOCK]: {
        logo: 'https://test.com/testNftLogo.jpg',
      },
    });

    const { container } = renderWithProvider(
      <Identicon {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
