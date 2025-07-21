import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import StepIndicator from './step-indicator.component';

const renderComponent = (
  props = {
    currentStep: 1,
    totalSteps: 3,
  },
) => {
  const store = configureMockStore([])({
    metamask: {},
  });
  return renderWithProvider(<StepIndicator {...props} />, store);
};

describe('StepIndicator Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });
});
