import React from 'react';
import { render } from '@testing-library/react';
import { SignatureStepStatus } from '../types';
import SignatureStatusIcon from '.';

jest.mock('../../../../components/ui/pulse-loader', () => () => (
  <div data-testid="pulse-loader" />
));

describe('SignatureStatusIcon', () => {
  it('renders check icon when status is Complete', () => {
    const { container } = render(
      <SignatureStatusIcon
        status={SignatureStepStatus.Complete}
        stepNumber={1}
      />,
    );

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders rejected icon when status is Rejected', () => {
    const { container } = render(
      <SignatureStatusIcon
        status={SignatureStepStatus.Rejected}
        stepNumber={1}
      />,
    );

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders rejected icon when status is Failed', () => {
    const { container } = render(
      <SignatureStatusIcon
        status={SignatureStepStatus.Failed}
        stepNumber={1}
      />,
    );

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders rejected icon when status is Disconnected', () => {
    const { container } = render(
      <SignatureStatusIcon
        status={SignatureStepStatus.Disconnected}
        stepNumber={1}
      />,
    );

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders pulse loader when status is Active', () => {
    const { getByTestId } = render(
      <SignatureStatusIcon
        status={SignatureStepStatus.Active}
        stepNumber={1}
      />,
    );

    expect(getByTestId('pulse-loader')).toBeDefined();
  });

  it('renders step number when status is Pending', () => {
    const { getByText } = render(
      <SignatureStatusIcon
        status={SignatureStepStatus.Pending}
        stepNumber={2}
      />,
    );

    expect(getByText('2')).toBeDefined();
  });

  it('renders step number 1 for pending step', () => {
    const { getByText } = render(
      <SignatureStatusIcon
        status={SignatureStepStatus.Pending}
        stepNumber={1}
      />,
    );

    expect(getByText('1')).toBeDefined();
  });
});
