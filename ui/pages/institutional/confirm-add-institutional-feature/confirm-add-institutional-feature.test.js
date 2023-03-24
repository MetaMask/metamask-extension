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
      provider: {
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
    expect(props.history.push).toHaveBeenCalledTimes(1);
  });

  it('runs setComplianceAuthData on confirm click', () => {
    render();
    fireEvent.click(screen.queryByText('Confirm'));
    expect(mockSetComplianceAuthData).toHaveBeenCalledTimes(1);
  });

  it('handles error', () => {
    mockSetComplianceAuthData = jest
      .fn()
      .mockReturnValue(new Error('Async error message'));
    const { container } = render();
    fireEvent.click(screen.queryByText('Confirm'));
    expect(container).toMatchSnapshot();
  });

  it('does not render without connectRequest', () => {
    const newState = {
      institutionalFeatures: {
        connectRequests: [],
      },
    };
    const { container } = render({ newState });
    expect(container).toMatchSnapshot();
  });
});
