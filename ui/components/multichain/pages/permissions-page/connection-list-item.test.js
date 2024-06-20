import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { getURLHost } from '../../../../helpers/utils/util';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { ConnectionListItem } from './connection-list-item';

describe('ConnectionListItem', () => {
  const store = configureStore(mockState);

  it('renders correctly for Snap connection', () => {
    const mockConnection = {
      id: 'npm:@metamask/testSnap1',
      origin: 'npm:@metamask/testSnap1',
      packageName: 'Test Snap 1',
      subjectType: 'snap',
      iconUrl: null,
    };
    const { getByText, getByTestId } = renderWithProvider(
      <ConnectionListItem connection={mockConnection} onClick={jest.fn()} />,
      store,
    );

    expect(getByTestId('connection-list-item')).toBeInTheDocument();
    expect(getByText('Test Snap 1')).toBeInTheDocument();
    expect(
      document.querySelector('.connection-list-item__snap-avatar'),
    ).toBeInTheDocument();
  });

  it('renders correctly for non-Snap connection', () => {
    const mockConnection = {
      id: 'https://metamask.github.io',
      origin: 'https://metamask.github.io',
      subjectType: 'website',
      iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      networkIconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      networkName: 'Test Dapp Network',
    };

    const { getByText, getByTestId } = renderWithProvider(
      <ConnectionListItem connection={mockConnection} onClick={jest.fn()} />,
      store,
    );

    expect(getByTestId('connection-list-item')).toBeInTheDocument();
    expect(
      getByText(getURLHost('https://metamask.github.io')),
    ).toBeInTheDocument();
    expect(
      getByTestId('connection-list-item__avatar-favicon'),
    ).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClickMock = jest.fn();
    const mockConnection = {
      id: 'npm:@metamask/testSnap1',
      origin: 'npm:@metamask/testSnap1',
      packageName: 'Test Snap 1',
      subjectType: 'snap',
      iconUrl: null,
    };
    const { getByTestId } = renderWithProvider(
      <ConnectionListItem connection={mockConnection} onClick={onClickMock} />,
      store,
    );

    fireEvent.click(getByTestId('connection-list-item'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('renders badgewrapper correctly for non-Snap connection', () => {
    const onClickMock = jest.fn();
    const mockConnection2 = {
      extensionId: null,
      iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      name: 'MM Test Dapp',
      origin: 'https://metamask.github.io',
      subjectType: 'website',
      addresses: ['0x0836f5ed6b62baf60706fe3adc0ff0fd1df833da'],
      addressToNameMap: {
        '0x0836f5ed6b62baf60706fe3adc0ff0fd1df833da':
          'Unreasonably long account name',
      },
      networkIconUrl: './images/eth_logo.svg',
      networkName: 'Ethereum Mainnet',
    };
    const { getByTestId } = renderWithProvider(
      <ConnectionListItem connection={mockConnection2} onClick={onClickMock} />,
      store,
    );

    expect(
      getByTestId('connection-list-item__avatar-network-badge'),
    ).toBeInTheDocument();

    expect(
      document
        .querySelector('.mm-avatar-network__network-image')
        .getAttribute('src'),
    ).toBe(mockConnection2.networkIconUrl);
  });
});
