import React from 'react';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  renderWithProvider,
  setBackgroundConnection,
} from '../../../../test/jest';
import ComplianceRow from '.';

const middleware = [thunk];
const createProps = (customProps = {}) => {
  return {
    address: '0xaddress',
    rowClick: sinon.spy(),
    inProgress: false,
    ...customProps,
  };
};

setBackgroundConnection({
  resetPostFetchState: jest.fn(),
});

describe('ComplianceRow', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)({
      metamask: {
        institutionalFeatures: {
          historicalReports: {
            '0xaddress': [
              {
                reportId: 'reportId',
                address: '0xaddress',
                risk: 'low',
                createTime: new Date(),
              },
              {
                reportId: 'reportId2',
                address: '0xaddress',
                risk: 'low',
                createTime: new Date(),
              },
            ],
          },
        },
      },
    });
    const props = createProps();
    const { getByText } = renderWithProvider(
      <ComplianceRow {...props} />,
      store,
    );
    expect(getByText('Risk:')).toBeDefined();
  });

  it('renders the component with loading bar', () => {
    const store = configureMockStore(middleware)({
      metamask: {
        institutionalFeatures: { historicalReports: {} },
      },
    });
    const props = {
      ...createProps(),
      inProgress: true,
    };
    const { getByTestId } = renderWithProvider(
      <ComplianceRow {...props} />,
      store,
    );
    expect(getByTestId('loading-element')).toBeDefined();
  });

  it('renders the component with valid reportOlderThanEightHours', () => {
    const store = configureMockStore(middleware)({
      metamask: {
        institutionalFeatures: {
          historicalReports: {
            '0xaddress': [
              {
                reportId: 'reportId',
                address: '0xaddress',
                risk: 'low',
                createTime: new Date().setHours(new Date().getHours() - 7),
              },
            ],
          },
        },
      },
    });
    const props = createProps();
    const { getByTestId } = renderWithProvider(
      <ComplianceRow {...props} />,
      store,
    );
    expect(getByTestId('report-valid')).toHaveClass(
      'compliance-row__column-report--valid',
    );
  });

  it('renders the component with invalid reportOlderThanEightHours', () => {
    const store = configureMockStore(middleware)({
      metamask: {
        institutionalFeatures: {
          historicalReports: {
            '0xaddress': [
              {
                reportId: 'reportId',
                address: '0xaddress',
                risk: 'low',
                createTime: new Date().setHours(new Date().getHours() - 9),
              },
            ],
          },
        },
      },
    });
    const props = createProps();
    const { getByTestId } = renderWithProvider(
      <ComplianceRow {...props} />,
      store,
    );
    expect(getByTestId('report-valid')).toHaveClass(
      'compliance-row__column-report--invalid',
    );
  });
});
