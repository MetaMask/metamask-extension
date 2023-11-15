import * as React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import SnapListItem from '.';

describe('SnapListItem', () => {
  const args = {
    name: 'Snap name',
    packageName: '@metamask/test-snap-bip44',
    snapId: 'npm:@metamask/test-snap-bip44',
    onClick: () => null,
  };
  const mockStore = configureMockStore([thunk])(mockState);

  it('should render the SnapListItem without crashing', () => {
    const { getByText } = renderWithProvider(
      <SnapListItem {...args} />,
      mockStore,
    );
    expect(getByText('Snap name')).toBeDefined();
  });

  it('should render the icon fallback using the first letter of the name', async () => {
    const { getByText } = renderWithProvider(
      <SnapListItem {...args} icon="" />,
      mockStore,
    );

    const avatar = await screen.findAllByText(/B/u);
    avatar.forEach((avatarBaseElement) => {
      expect(avatarBaseElement).toHaveClass('mm-avatar-base');
    });
    expect(getByText('B')).toBeDefined();
  });

  it('should render the package name', () => {
    const { getByText } = renderWithProvider(
      <SnapListItem {...args} icon="" />,
      mockStore,
    );
    expect(getByText('@metamask/test-snap-bip44')).toBeDefined();
  });
});
