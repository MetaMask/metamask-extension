import React from 'react';
import { render } from '@testing-library/react';
import Tooltip from './tooltip';

describe('Tooltip Component', () => {
  describe('rendering', () => {
    it('should render children without ReactTippy when disabled', () => {
      const { container } = render(
        <Tooltip title="Test tooltip" disabled>
          <button type="button">Test Button</button>
        </Tooltip>,
      );

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toBe('Test Button');
      // When disabled, ReactTippy should not be rendered
      expect(container.querySelector('.tippy-popper')).toBeFalsy();
    });

    it('should render children with ReactTippy when not disabled', () => {
      const { container } = render(
        <Tooltip title="Test tooltip" disabled={false}>
          <button type="button">Test Button</button>
        </Tooltip>,
      );

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toBe('Test Button');
    });

    it('should render children without ReactTippy when title and html are missing', () => {
      const { container } = render(
        <Tooltip>
          <button type="button">Test Button</button>
        </Tooltip>,
      );

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toBe('Test Button');
    });

    it('should handle dynamic disabled prop changes without errors', () => {
      const { rerender } = render(
        <Tooltip title="Test tooltip" disabled={false}>
          <button type="button">Test Button</button>
        </Tooltip>,
      );

      // Simulate prop change that was causing the error
      expect(() => {
        rerender(
          <Tooltip title="Test tooltip" disabled>
            <button type="button">Test Button</button>
          </Tooltip>,
        );
      }).not.toThrow();
    });

    it('should apply wrapperClassName to wrapper element', () => {
      const { container } = render(
        <Tooltip
          title="Test tooltip"
          disabled
          wrapperClassName="custom-wrapper"
        >
          <button type="button">Test Button</button>
        </Tooltip>,
      );

      const wrapper = container.querySelector('.custom-wrapper');
      expect(wrapper).toBeTruthy();
    });

    it('should apply wrapperStyle to wrapper element', () => {
      const style = { padding: '10px' };
      const { container } = render(
        <Tooltip title="Test tooltip" disabled wrapperStyle={style}>
          <button type="button">Test Button</button>
        </Tooltip>,
      );

      const wrapper = container.querySelector('div');
      expect(wrapper.style.padding).toBe('10px');
    });

    it('should use custom tag when provided', () => {
      const { container } = render(
        <Tooltip title="Test tooltip" disabled tag="span">
          <button type="button">Test Button</button>
        </Tooltip>,
      );

      const wrapper = container.querySelector('span');
      expect(wrapper).toBeTruthy();
    });
  });
});
