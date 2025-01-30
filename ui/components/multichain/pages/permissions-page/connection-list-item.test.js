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
      addresses: [
        '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B',
        '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
      ],
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
});
