import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import ConfirmAddInstitutionalFeature from '.';

const mockRemoveConnectInstitutionalFeature = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });

let mockSetComplianceAuthData = jest.fn().mockReturnValue({ type: 'TYPE' });

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    setComplianceAuthData: mockSetComplianceAuthData,
    removeConnectInstitutionalFeature: mockRemoveConnectInstitutionalFeature,
  }),
}));

const connectRequests = [
  {
    labels: [
      {
        key: 'service',
        value: 'test',
      },
    ],
    origin: 'origin',
    token: {
      projectName: 'projectName',
      projectId: 'projectId',
      clientId: 'clientId',
    },
  },
];

const props = {
  history: {
    push: jest.fn(),
  },
};

const render = ({ newState } = {}) => {
  const state = {
    ...mockState,
    metamask: {
      providerConfig: {
        type: 'test',
      },
      institutionalFeatures: {
        complianceProjectId: '',
        connectRequests,
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      ...newState,
    },
  };
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);
  const store = mockStore(state);

  return renderWithProvider(
    <ConfirmAddInstitutionalFeature {...props} />,
    store,
  );
};

describe('Confirm Add Institutional Feature', function () {
  it('opens confirm institutional sucessfully', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
    expect(
      screen.getByText(`Id: ${connectRequests[0].token.projectId}`),
    ).toBeInTheDocument();
  });

  it('runs removeConnectInstitutionalFeature on cancel click', () => {
    render();
    fireEvent.click(screen.queryByText('Cancel'));
    expect(mockRemoveConnectInstitutionalFeature).toHaveBeenCalledTimes(1);
    expect(mockRemoveConnectInstitutionalFeature).toHaveBeenCalledWith({
      origin: connectRequests[0].origin,
      projectId: connectRequests[0].token.projectId,
    });
    expect(props.history.push).toHaveBeenCalledTimes(1);
  });

  it('runs setComplianceAuthData on confirm click', () => {
    render();
    fireEvent.click(screen.queryByText('Confirm'));
    expect(mockSetComplianceAuthData).toHaveBeenCalledTimes(1);
    expect(mockSetComplianceAuthData).toHaveBeenCalledWith({
      clientId: connectRequests[0].token.clientId,
      projectId: connectRequests[0].token.projectId,
    });
  });

  it('handles error', () => {
    mockSetComplianceAuthData = jest
      .fn()
      .mockReturnValue(new Error('Async error message'));
    const { queryByTestId } = render();
    fireEvent.click(screen.queryByText('Confirm'));
    expect(queryByTestId('connect-error-message')).toBeInTheDocument();
  });

  it('does not render without connectRequest', () => {
    const newState = {
      institutionalFeatures: {
        connectRequests: [],
      },
    };
    const { queryByTestId } = render({ newState });
    expect(
      queryByTestId('confirm-add-institutional-feature'),
    ).not.toBeInTheDocument();
  });
});
