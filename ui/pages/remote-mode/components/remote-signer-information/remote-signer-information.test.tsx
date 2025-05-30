import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
import { RemoteSignerInformation } from './remote-signer-information.component';

const signerAddress = '0x0000000000000000000000000000000000000000';
const originalSenderAddress = '0x0000000000000000000000000000000000000001';

const renderComponent = () => {
  const store = configureMockStore()({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      // Add any specific state needed for this component
    },
  });
  return renderWithProvider(
    <MemoryRouter>
      <RemoteSignerInformation
        signerAddress={signerAddress}
        originalSenderAddress={originalSenderAddress}
      />
    </MemoryRouter>,
    store,
  );
};

describe('RemoteSignerInformation', () => {
  it('should render correctly', () => {
    const { getByText } = renderComponent();
    expect(getByText('Remote Signer')).toBeInTheDocument();
  });
});
