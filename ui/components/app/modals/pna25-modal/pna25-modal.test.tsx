import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../test/data/mock-state.json';
import {
  en as messages,
  renderWithProvider,
} from '../../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { setPna25Acknowledged } from '../../../../store/actions';
import Pna25Modal from './pna25-modal';

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  setPna25Acknowledged: jest.fn(() => jest.fn()),
}));

const mockStore = configureMockStore([thunk]);

const mockTrackEvent = jest.fn();
const mockMetaMetricsContext = {
  trackEvent: mockTrackEvent,
  bufferedTrace: jest.fn(),
  bufferedEndTrace: jest.fn(),
  onboardingParentContext: { current: null },
};

function renderComponent() {
  const store = mockStore(mockState);
  return renderWithProvider(
    <MetaMetricsContext.Provider
      value={mockMetaMetricsContext as typeof mockMetaMetricsContext}
    >
      <Pna25Modal />
    </MetaMetricsContext.Provider>,
    store,
  );
}

describe('Pna25Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not skip delay on initial view', () => {
    renderComponent();

    expect(setPna25Acknowledged).not.toHaveBeenCalled();
  });

  it('skips delay when Accept and Close is clicked', () => {
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('pna25-modal-accept'));

    expect(setPna25Acknowledged).toHaveBeenCalledWith(true, true);
  });

  it('skips delay when Close (X) button is clicked', () => {
    const { getByLabelText } = renderComponent();

    fireEvent.click(getByLabelText(messages.close.message));

    expect(setPna25Acknowledged).toHaveBeenCalledWith(true, true);
  });

  it('does not skip delay when Open Settings is clicked', () => {
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('pna25-modal-open-settings'));

    expect(setPna25Acknowledged).toHaveBeenCalledWith(true, false);
  });
});
