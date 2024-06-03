import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import DeveloperOptionsTab from '.';

const mockSetServiceWorkerKeepAlivePreference = jest.fn();

jest.mock('../../../store/actions.ts', () => ({
  setServiceWorkerKeepAlivePreference: () =>
    mockSetServiceWorkerKeepAlivePreference,
}));

describe('Develop options tab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <DeveloperOptionsTab />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should toggle Service Worker Keep Alive', async () => {
    const { getByTestId } = renderWithProvider(
      <DeveloperOptionsTab />,
      mockStore,
    );
    const triggerButton = getByTestId(
      'developer-options-service-worker-alive-toggle',
    );
    expect(triggerButton).toBeInTheDocument();
    fireEvent.click(triggerButton);

    expect(mockSetServiceWorkerKeepAlivePreference).toHaveBeenCalled();
  });
});
