import React from 'react';
import { fireEvent, queryByText } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import ComplianceDetailsModal from './compliance-details-modal';

const props = {
  hideModal: jest.fn(),
  onGenerateComplianceReport: jest.fn(),
  reportAddress: '0xAddress',
};

const render = () => {
  const store = configureStore({
    ...mockState,
    metamask: {},
    history: {
      mostRecentOverviewPage: 'test',
    },
  });

  return renderWithProvider(<ComplianceDetailsModal {...props} />, store);
};

describe('Compliance Modal', function () {
  // for some reason unit tests for opening new tab are not working when there is more than one test in the one run
  // and since there is one in account-details-modal.test.js testing here was not working
  // TODO: Add tests after moving to jest unit tests

  it('closes', function () {
    render();
    fireEvent.click(queryByText('[cancel]'));

    expect(props.hideModal).toHaveBeenCalled();
    props.hideModal.resetHistory();
  });
});
