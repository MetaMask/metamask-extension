import * as React from 'react';
import { render } from '@testing-library/react';
import { SelectWrapper } from '../select-wrapper';
import { SelectButton } from '.';

describe('SelectButton', () => {
  it('should render the SelectButton without crashing', () => {
    const { container } = render(
      <SelectWrapper triggerComponent={<SelectButton>Trigger</SelectButton>}>
        Test
      </SelectWrapper>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render the SelectButton with additional className', () => {
    const { getByTestId } = render(
      <SelectWrapper
        triggerComponent={
          <SelectButton data-testid="classname" className="mm-test">
            Trigger
          </SelectButton>
        }
      >
        Test
      </SelectWrapper>,
    );
    expect(getByTestId('classname')).toHaveClass('mm-select-button mm-test');
  });
});
