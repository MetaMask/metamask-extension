import * as React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { SelectButton } from '../select-button';
import { SelectWrapper } from '.';

describe('SelectWrapper', () => {
  it('should render the SelectWrapper without crashing', () => {
    const { container } = render(
      <SelectWrapper
        isOpen={true}
        triggerComponent={<button>Test Button</button>}
      >
        <div>Test</div>
      </SelectWrapper>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render the SelectWrapper with additional className and SelectWrapper popover has additional className', () => {
    const { getByTestId } = render(
      <SelectWrapper
        className="mm-select-wrapper mm-test"
        data-testid="classname"
        popoverProps={{
          'data-testid': 'popover-classname',
          className: 'mm-select-wrapper__popover mm-test',
        }}
        triggerComponent={<SelectButton>Test</SelectButton>}
        isOpen={true}
      >
        <div>Test</div>
      </SelectWrapper>,
    );
    expect(getByTestId('classname')).toHaveClass('mm-select-wrapper mm-test');
    expect(getByTestId('popover-classname')).toHaveClass(
      'mm-select-wrapper__popover mm-test',
    );
  });

  it('should call custom onBlur handler when provided', () => {
    const customOnBlur = jest.fn();
    const { getByTestId } = render(
      <SelectWrapper
        onBlur={customOnBlur}
        triggerComponent={
          <SelectButton data-testid="trigger">Test Button</SelectButton>
        }
      >
        <div data-testid="content">Test</div>
      </SelectWrapper>,
    );

    const triggerButton = getByTestId('trigger');
    fireEvent.blur(triggerButton);

    expect(customOnBlur).toHaveBeenCalled();
  });

  const ControlledOpenDemo = () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <SelectWrapper
        isOpen={isOpen}
        onOpenChange={() => setIsOpen(!isOpen)}
        data-testid="wrapper-blur"
        triggerComponent={
          <SelectButton
            data-testid="trigger"
            onClick={() => setIsOpen(!isOpen)}
          >
            Test Button
          </SelectButton>
        }
      >
        <div data-testid="content">Test</div>
      </SelectWrapper>
    );
  };

  it('should call built-in onBlur when no custom onBlur provided', () => {
    const { getByTestId, queryByTestId } = render(<ControlledOpenDemo />);

    const triggerButton = getByTestId('trigger');
    fireEvent.click(triggerButton);
    expect(getByTestId('content')).toBeVisible();

    const wrapperBlur = getByTestId('wrapper-blur');
    fireEvent.blur(wrapperBlur);
    // The content should not be visible after the blur event
    expect(queryByTestId('content')).not.toBeInTheDocument();
  });
});
