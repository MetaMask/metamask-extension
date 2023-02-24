import React from 'react';
import sinon from 'sinon';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mountWithRouter } from '../../../../test/lib/render-helpers';
import ComplianceDetails from './compliance-details';

const initState = {
  metamask: {
    institutionalFeatures: {
      complianceProjectId: '',
      complianceClientId: '',
      reportsInProgress: {},
    },
  },
  institutionalFeatures: {
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
    complianceProjectId: '',
    complianceClientId: '',
    reportsInProgress: {},
  },
};
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('ComplianceDetails', () => {
  let wrapper;

  const props = {
    address: '0xAddress',
    onClose: sinon.spy(),
    onGenerate: sinon.stub(),
  };

  beforeEach(() => {
    const store = mockStore(initState);
    wrapper = mountWithRouter(
      <Provider store={store}>
        <ComplianceDetails
          address={props.address}
          onClose={props.onClose}
          onGenerate={props.onGenerate}
        />
      </Provider>,
    );
  });

  it('runs onGenerate fuction', () => {
    const showReportButton = wrapper.find(
      'button[data-testid="page-container-footer-next"]',
    );
    showReportButton.simulate('click');
    expect(props.onGenerate.calledOnce).toBe(true);
  });
});
