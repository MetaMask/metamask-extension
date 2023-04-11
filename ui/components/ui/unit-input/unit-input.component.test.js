import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import UnitInput from './unit-input.component';

describe('UnitInput Component', () => {
  describe('rendering', () => {
    it('should match snapshot without a suffix', () => {
      const { container } = renderWithProvider(<UnitInput />);

      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with a suffix', () => {
      const { container } = renderWithProvider(<UnitInput suffix="ETH" />);

      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with a child component', () => {
      const { container } = renderWithProvider(
        <UnitInput>
          <div className="testing">TESTCOMPONENT</div>
        </UnitInput>,
      );

      expect(container).toMatchSnapshot();
    });

    it('should match snapshot of error class when props.error === true', () => {
      const { container } = renderWithProvider(<UnitInput error />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('handling actions', () => {
    const handleChangeSpy = jest.fn();
    const handleOnBlurSpy = jest.fn();

    it('should call onChange and onBlur on input changes with the value', async () => {
      const { queryByTestId } = renderWithProvider(
        <UnitInput
          onChange={handleChangeSpy}
          onBlur={handleOnBlurSpy}
          dataTestId="unit-input"
        />,
      );

      const input = queryByTestId('unit-input');

      fireEvent.blur(input);
      fireEvent.change(input, { target: { value: 2 } });

      expect(handleOnBlurSpy).toHaveBeenCalled();
      expect(handleChangeSpy).toHaveBeenCalledWith('2');
    });
  });
});
