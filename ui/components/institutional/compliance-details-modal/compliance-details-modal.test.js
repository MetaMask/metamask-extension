import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
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
  it('closes', function () {
    const { getByText } = render();

    expect(getByText('AML/CFT Compliance')).toBeVisible();
  });
});
