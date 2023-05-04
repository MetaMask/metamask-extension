import React from 'react';
import configureStore from 'redux-mock-store';
import { fireEvent, screen } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import ComplianceDetails from './compliance-details';

const initState = {
  metamask: {
    institutionalFeatures: {
      complianceProjectId: '',
      complianceClientId: '',
      reportsInProgress: {},
      historicalReports: {
        '0xAddress': [
          {
            reportId: 'reportId',
            address: '0xAddress',
            risk: 'low',
            creatTime: new Date(),
          },
        ],
      },
    },
  },
};
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('ComplianceDetails', () => {
  const props = {
    address: '0xAddress',
    onClose: jest.fn(),
    onGenerate: jest.fn(),
  };

  const store = mockStore(initState);

  it('should render correctly', () => {
    const { container } = renderWithProvider(
      <ComplianceDetails
        address={props.address}
        onClose={props.onClose}
        onGenerate={props.onGenerate}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('runs onGenerate fuction', () => {
    renderWithProvider(
      <ComplianceDetails
        address={props.address}
        onClose={props.onClose}
        onGenerate={props.onGenerate}
      />,
      store,
    );

    fireEvent.click(screen.queryByTestId('page-container-footer-next'));

    expect(props.onGenerate).toHaveBeenCalledTimes(1);
    expect(props.onGenerate).toHaveBeenCalledWith(props.address);
  });
});
