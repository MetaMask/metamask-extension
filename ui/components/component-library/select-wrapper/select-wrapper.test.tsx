import * as React from 'react';
import { render } from '@testing-library/react';
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
});
