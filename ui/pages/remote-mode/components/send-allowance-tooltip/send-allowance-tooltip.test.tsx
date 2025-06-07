import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
import SendAllowanceTooltip from './send-allowance-tooltip.component';

const renderComponent = () => {
  const store = configureMockStore()({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      isRemoteModeEnabled: true,
    },
  });
  return renderWithProvider(
    <SendAllowanceTooltip hasAllowance={true} />,
    store,
  );
};

// note: placeholder test for now (will be expanded as component is finalized)
describe('SendAllowanceTooltip Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });
});
