import * as React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import SnapView from './snap-view';

jest.mock('../../../store/actions.ts', () => {
  return {
    disableSnap: jest.fn(),
    enableSnap: jest.fn(),
    removeSnap: jest.fn(),
    removePermissionsFor: jest.fn(),
    updateCaveat: jest.fn(),
    getPhishingResult: jest.fn().mockImplementation(() => {
      return {
        result: false,
      };
    }),
  };
});

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useLocation: jest.fn(() => ({
      pathname: `/snaps/view/${encodeURIComponent(
        'npm:@metamask/test-snap-bip44',
      )}`,
    })),
  };
});

const mockStore = configureMockStore([thunk])(mockState);

describe('SnapView', () => {
  it('should properly display Snap View elements', async () => {
    const { getByText, container, getByTestId, getAllByText } =
      renderWithProvider(<SnapView />, mockStore);

    // Snap name & Snap authorship component
    expect(getAllByText('BIP-44 Test Snap')).toHaveLength(2);
    expect(
      container.getElementsByClassName('snaps-authorship-expanded')?.length,
    ).toBe(1);
    // Snap description
    expect(
      getByText('An example Snap that signs messages using BLS.'),
    ).toBeDefined();
    // Snap website
    await waitFor(() => {
      const websiteElement = screen.queryByText('https://snaps.consensys.io/');
      expect(websiteElement).toBeDefined();
      expect(getByText('https://snaps.consensys.io/')).toBeDefined();
    });
    // Snap version info
    expect(getByText('5.1.2')).toBeDefined();
    // Enable Snap
    expect(getByText('Enabled')).toBeDefined();
    expect(container.getElementsByClassName('toggle-button')?.length).toBe(1);
    // Permissions
    expect(getByText('Permissions')).toBeDefined();
    expect(
      container.getElementsByClassName('snap-permissions-list')?.length,
    ).toBe(1);
    // Connected sites
    expect(getByText('Connected sites')).toBeDefined();
    expect(
      container.getElementsByClassName('connected-sites-list__content-rows')
        ?.length,
    ).toBe(1);
    // Remove snap
    expect(getByText('Remove Snap')).toBeDefined();
    expect(
      getByText(
        'This action will delete the snap, its data and revoke your given permissions.',
      ),
    ).toBeDefined();
    expect(getByText('Remove BIP-44 Test Snap')).toBeDefined();
    expect(getByTestId('remove-snap-button')).toHaveClass(
      'snap-view__content__remove-button',
    );
  });
});
