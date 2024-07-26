import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { getTokenList } from '../../../selectors';
import { getNftContractsByAddressOnCurrentChain } from '../../../selectors/nft';
import Identicon from '.';

jest.mock('../../../selectors', () => ({
  ...jest.requireActual('../../../selectors'),
  getTokenList: jest.fn(),
}));

jest.mock('../../../selectors/nft', () => ({
  ...jest.requireActual('../../../selectors/nft'),
  getNftContractsByAddressOnCurrentChain: jest.fn(),
}));

const ADDRESS_MOCK = '0x0000000000000000000000000000000000000000';

const mockState = {
  metamask: {
    useBlockie: false,
  },
};

const mockStore = configureMockStore()(mockState);

describe('Identicon', () => {
  const getTokenListMock = jest.mocked(getTokenList);
  const getNftContractsByAddressOnCurrentChainMock = jest.mocked(
    getNftContractsByAddressOnCurrentChain,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue({});
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

    getNftContractsByAddressOnCurrentChainMock.mockReturnValue({
      [ADDRESS_MOCK]: {
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
