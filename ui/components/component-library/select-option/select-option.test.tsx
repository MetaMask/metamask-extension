import * as React from 'react';
import { render } from '@testing-library/react';
import { SelectWrapper } from '../select-wrapper';
import { SelectOption } from '.';

describe('SelectOption', () => {
  it('should render the SelectOption without crashing', () => {
    const { container } = render(
      <SelectWrapper isOpen={true} triggerComponent={<button>Trigger</button>}>
        <SelectOption />
      </SelectWrapper>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render the SelectOption with additional className', () => {
    const { getByTestId } = render(
      <SelectWrapper isOpen={true} triggerComponent={<button>Trigger</button>}>
        <SelectOption data-testid="classname" className="mm-test" />
      </SelectWrapper>,
    );
    expect(getByTestId('classname')).toHaveClass('mm-select-option mm-test');
  });
});
