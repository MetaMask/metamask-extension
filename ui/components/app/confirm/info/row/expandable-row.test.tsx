import React from 'react';
import { render } from '@testing-library/react';
import { ConfirmInfoExpandableRow } from './expandable-row';

describe('ConfirmInfoExpandableRow', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ConfirmInfoExpandableRow label="Expandable Row" content="Hidden Content">
        Expandable Value
      </ConfirmInfoExpandableRow>,
    );

    expect(container).toMatchSnapshot();
  });

  it('applies measured height when startExpanded is true', () => {
    const scrollHeightSpy = jest
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.classList.contains('expandable') ? 48 : 0;
      });

    const { container } = render(
      <ConfirmInfoExpandableRow
        label="Expandable Row"
        content="Hidden Content"
        startExpanded
      >
        Expandable Value
      </ConfirmInfoExpandableRow>,
    );

    scrollHeightSpy.mockRestore();

    const expandable = container.querySelector('.expandable') as HTMLElement;
    expect(expandable.style.height).toBe('48px');
  });
});
