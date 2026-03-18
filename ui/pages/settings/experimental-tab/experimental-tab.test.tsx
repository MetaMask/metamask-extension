import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { LegacyMetaMetricsProvider } from '../../../contexts/metametrics';
import * as storeActions from '../../../store/actions';
import { isFlask } from '../../../../shared/lib/build-types';
import ExperimentalTab from './experimental-tab';

// Allow each test to set whether it's Flask or not
jest.mock('../../../../shared/lib/build-types', () => ({
  ...jest.requireActual('../../../../shared/lib/build-types'),
  isFlask: jest.fn(),
}));

const mockIsFlask = jest.mocked(isFlask);

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setAddSnapAccountEnabled: jest.fn().mockReturnValue(async () => undefined),
}));

const render = (overrideMetaMaskState = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      ...overrideMetaMaskState,
    },
  });
  return renderWithProvider(
    <LegacyMetaMetricsProvider>
      <ExperimentalTab />
    </LegacyMetaMetricsProvider>,
    store,
  );
};

describe('ExperimentalTab', () => {
  it('renders ExperimentalTab component without error', () => {
    mockIsFlask.mockReturnValue(false);
    expect(() => {
      render();
    }).not.toThrow();
  });

  it('renders one toggle option when build type is main', () => {
    mockIsFlask.mockReturnValue(false);
    const { getAllByRole } = render();
    const toggle = getAllByRole('checkbox');

    expect(toggle).toHaveLength(1);
  });

  it('renders two toggle options when build type is flask', () => {
    mockIsFlask.mockReturnValue(true);
    const { getAllByRole } = render();
    const toggle = getAllByRole('checkbox');

    expect(toggle).toHaveLength(2);
  });

  it('enables add account snap', async () => {
    mockIsFlask.mockReturnValue(true);
    const { getByTestId } = render();

    const toggle = getByTestId('add-account-snap-toggle-button');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(storeActions.setAddSnapAccountEnabled).toHaveBeenCalledWith(true);
    });
  });
});
