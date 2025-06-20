/* eslint-disable jest/require-top-level-describe */
import { screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import { AvatarGroup } from './avatar-group';

const members = [
  { symbol: 'ETH', avatarValue: './images/eth_logo.svg' },
  { symbol: 'MATIC', avatarValue: './images/pol-token.svg' },
  { symbol: 'OP', avatarValue: './images/optimism.svg' },
  { symbol: 'AVAX', avatarValue: './images/avax-token.svg' },
  { symbol: 'PALM', avatarValue: './images/palm.svg' },
];

describe('AvatarGroup', () => {
  const mockStore = configureMockStore()(mockState);

  it('should render AvatarGroup component', () => {
    const { getByTestId, container } = renderWithProvider(
      <AvatarGroup members={members} limit={4} />,
      mockStore,
    );
    expect(getByTestId('avatar-group')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render the tag +1 if members has a length greater than limit', () => {
    renderWithProvider(<AvatarGroup members={members} limit={4} />, mockStore);

    expect(screen.getByText('+1')).toBeDefined();
  });

  it('should not render the tag if members has a length less than or equal to limit', () => {
    const { queryByText } = renderWithProvider(
      <AvatarGroup members={members} limit={5} />,
      mockStore,
    );
    expect(queryByText('+1')).not.toBeInTheDocument();
  });
});
