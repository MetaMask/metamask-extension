import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json'; // Adjust the path based on your actual file location
import ToggleRow from './developer-options-toggle-row-component';

describe('ToggleFeatureRow Component', () => {
  const mockTitle = 'Test Title';
  const mockDescription = 'Test Description';
  const mockDataTestId = 'Test id';
  const mockSettingsRef = { current: document.createElement('div') };

  const mockStore = configureMockStore([thunk])(mockState);

  it('renders ToggleFeatureRow correctly', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <ToggleRow
        title={mockTitle}
        description={mockDescription}
        isEnabled={true}
        onToggle={() => {
          //* eslint-disable-next-line @typescript-eslint/no-empty-function
        }}
        dataTestId={mockDataTestId}
        settingsRef={mockSettingsRef}
      />,
      mockStore,
    );

    expect(getByText(mockTitle)).toBeInTheDocument();
    expect(getByText(mockDescription)).toBeInTheDocument();
    expect(getByTestId(mockDataTestId)).toBeInTheDocument();
  });
});
