import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { LegacyMetaMetricsProvider } from '../../../contexts/metametrics';
import * as storeActions from '../../../store/actions';
import ExperimentalTab from './experimental-tab';

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
    expect(() => {
      render();
    }).not.toThrow();
  });

  it('renders one toggle option when build type is main', () => {
    process.env.METAMASK_BUILD_TYPE = 'main';
    const { getAllByRole } = render();
    const toggle = getAllByRole('checkbox');

    expect(toggle).toHaveLength(1);
  });

  it('renders two toggle options when build type is flask', () => {
    process.env.METAMASK_BUILD_TYPE = 'flask';
    const { getAllByRole } = render();
    const toggle = getAllByRole('checkbox');

    expect(toggle).toHaveLength(2);
  });

  it('enables add account snap', async () => {
    const { getByTestId } = render();

    const toggle = getByTestId('add-account-snap-toggle-button');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(storeActions.setAddSnapAccountEnabled).toHaveBeenCalledWith(true);
    });
  });
});
