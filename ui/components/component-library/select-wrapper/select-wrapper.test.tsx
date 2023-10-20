import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { SelectButton } from '../select-button';
import { SelectOption } from '../select-option';
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

  it('should render the SelectWrapper children', () => {
    const { getByText } = render(
      <SelectWrapper
        isOpen={true}
        triggerComponent={<button>Test Button</button>}
      >
        <div>Test</div>
      </SelectWrapper>,
    );
    expect(getByText('Test')).toBeInTheDocument();
  });

  // This test is part of controlled value
  it('should render the SelectWrapper value', () => {
    const { getByText } = render(
      <SelectWrapper
        isOpen={true}
        value="Test Value"
        triggerComponent={<SelectButton>Test Button</SelectButton>}
      >
        <div>Test</div>
      </SelectWrapper>,
    );
    expect(getByText('Test Value')).toBeInTheDocument();
  });
  it('should render the SelectWrapper defaultValue', () => {
    const { getByText } = render(
      <SelectWrapper
        isOpen={true}
        defaultValue="Test Default Value"
        triggerComponent={<SelectButton>Test Button</SelectButton>}
      >
        <div>Test</div>
      </SelectWrapper>,
    );
    expect(getByText('Test Default Value')).toBeInTheDocument();
  });

  it('should render the SelectWrapper placeholder', () => {
    const { getByText } = render(
      <SelectWrapper
        isOpen={true}
        placeholder="Test Placeholder"
        triggerComponent={<SelectButton>Test Button</SelectButton>}
      >
        <div>Test</div>
      </SelectWrapper>,
    );
    expect(getByText('Test Placeholder')).toBeInTheDocument();
  });

  const OptionValueChangeDemo = () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <SelectWrapper
        isOpen={isOpen}
        onOpenChange={() => setIsOpen(!isOpen)}
        defaultValue={'Default Value'}
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
        <SelectOption data-testid="optionButton" value="Changed to option 1">
          Option 1
        </SelectOption>
      </SelectWrapper>
    );
  };

  it('should render the SelectWrapper isDisabled', () => {
    const { getByTestId } = render(
      <SelectWrapper
        defaultValue="Test Default Value"
        isDisabled={true}
        triggerComponent={
          <SelectButton data-testid="trigger">Test Button</SelectButton>
        }
      >
        <div>Test</div>
      </SelectWrapper>,
    );
    expect(getByTestId('trigger')).toHaveClass('mm-select-button--disabled');
  });

  it('should render the SelectWrapper isDanger', () => {
    const { getByTestId } = render(
      <SelectWrapper
        defaultValue="Test Default Value"
        isDanger={true}
        triggerComponent={
          <SelectButton data-testid="trigger">Test Button</SelectButton>
        }
      >
        <div>Test</div>
      </SelectWrapper>,
    );
    expect(getByTestId('trigger')).toHaveClass('mm-select-button--type-danger');
  });

  it('should render the SelectWrapper defaultValue then uncontrolled select will change value', () => {
    const { getByText, getByTestId } = render(<OptionValueChangeDemo />);
    expect(getByText('Default Value')).toBeInTheDocument();
    const trigger = getByTestId('trigger');
    fireEvent.click(trigger);
    const optionButton = getByTestId('optionButton');
    fireEvent.click(optionButton);
    expect(getByText('Changed to option 1')).toBeInTheDocument();
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

  it('controlledOpen should toggle open and close', () => {
    const { getByTestId, queryByTestId } = render(<ControlledOpenDemo />);

    const triggerButton = getByTestId('trigger');

    // Popover should be visible
    fireEvent.click(triggerButton);
    expect(getByTestId('content')).toBeVisible();
    // Popover should be visible
    fireEvent.click(triggerButton);
    expect(queryByTestId('content')).not.toBeInTheDocument();
  });

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
