import React from 'react';
import configureMockStore from 'redux-mock-store';
import copyToClipboard from 'copy-to-clipboard';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import SelectedAccount from '.';

jest.mock('copy-to-clipboard');

describe('SelectedAccount Component', () => {
  const mockStore = configureMockStore()(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<SelectedAccount />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('should copy checksum address to clipboard when button is clicked', () => {
    const { queryByTestId } = renderWithProvider(
      <SelectedAccount />,
      mockStore,
    );

    fireEvent.click(queryByTestId('selected-account-click'));

    expect(copyToClipboard).toHaveBeenCalledWith(
      '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
    );
  });
});
