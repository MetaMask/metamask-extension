import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import Slider from './slider.component';

describe('Slider Component', () => {
  describe('rendering', () => {
    it('should render properly', () => {
      expect(() => {
        render(<Slider />);
      }).not.toThrow();
    });

    it('should contain passed header props', () => {
      const wrapper = render(
        <Slider
          titleText="Slider Title Text"
          tooltipText="Slider Tooltip Text"
          valueText="$ 00.00"
          titleDetail="100 GWEI"
        />,
      );

      expect(wrapper.getAllByText('Slider Title Text')).toBeDefined();
      expect(wrapper.getAllByText('$ 00.00')).toBeDefined();
      expect(wrapper.getAllByText('100 GWEI')).toBeDefined();
    });

    it('should contain passed footer props', () => {
      const wrapper = render(
        <Slider
          infoText="Footer Info Text"
          editText="Edit GWEI"
          onEdit={() => {
            console.log('on edit click');
          }}
        />,
      );

      expect(wrapper.getAllByText('Footer Info Text')).toBeDefined();
      expect(
        wrapper.getByRole('button', { name: 'edit as numeric input' }),
      ).toBeDefined();
      expect(wrapper.getAllByText('Edit GWEI')).toBeDefined();
    });

    it('should call onEdit callback when edit button is clicked', () => {
      const mockEditFn = jest.fn();
      const wrapper = render(
        <Slider infoText="Footer Info Text" onEdit={mockEditFn} />,
      );

      const editButton = wrapper.getByRole('button');
      fireEvent.click(editButton);
      expect(mockEditFn).toHaveBeenCalledTimes(1);
    });
  });
});
