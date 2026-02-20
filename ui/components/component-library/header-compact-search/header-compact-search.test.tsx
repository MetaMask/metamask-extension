/* eslint-disable jest/require-top-level-describe */
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { HeaderCompactSearch } from './header-compact-search';
import { HeaderCompactSearchVariant } from './header-compact-search.types';

describe('HeaderCompactSearch', () => {
  const defaultSearchProps = {
    value: '',
    placeholder: 'Search',
  };

  describe('Screen variant', () => {
    it('renders back button and search input', () => {
      const onClickBackButton = jest.fn();
      const { getByRole, getByPlaceholderText } = render(
        <HeaderCompactSearch
          variant={HeaderCompactSearchVariant.Screen}
          onClickBackButton={onClickBackButton}
          textFieldSearchProps={{
            ...defaultSearchProps,
            inputProps: { 'data-testid': 'header-compact-search-input' },
          }}
        />,
      );

      const backButton = getByRole('button');
      expect(backButton).toBeDefined();
      expect(getByPlaceholderText('Search')).toBeDefined();
      expect(backButton.closest('header')).toHaveClass(
        'mm-header-compact-search',
      );
    });

    it('invokes callback when back button is clicked', () => {
      const onClickBackButton = jest.fn();
      const { getByRole } = render(
        <HeaderCompactSearch
          variant={HeaderCompactSearchVariant.Screen}
          onClickBackButton={onClickBackButton}
          textFieldSearchProps={defaultSearchProps}
        />,
      );

      fireEvent.click(getByRole('button'));

      expect(onClickBackButton).toHaveBeenCalledTimes(1);
    });
  });

  describe('Inline variant', () => {
    it('renders search input and cancel button', () => {
      const onClickCancelButton = jest.fn();
      const { getByText, getByPlaceholderText } = render(
        <HeaderCompactSearch
          variant={HeaderCompactSearchVariant.Inline}
          onClickCancelButton={onClickCancelButton}
          textFieldSearchProps={defaultSearchProps}
        />,
      );

      expect(getByPlaceholderText('Search')).toBeDefined();
      expect(getByText('[cancel]')).toBeDefined();
    });

    it('invokes callback when cancel button is clicked', () => {
      const onClickCancelButton = jest.fn();
      const { getByText } = render(
        <HeaderCompactSearch
          variant={HeaderCompactSearchVariant.Inline}
          onClickCancelButton={onClickCancelButton}
          textFieldSearchProps={defaultSearchProps}
        />,
      );

      fireEvent.click(getByText('[cancel]'));

      expect(onClickCancelButton).toHaveBeenCalledTimes(1);
    });
  });

  describe('textFieldSearchProps', () => {
    it('invokes onChangeText with input value when user types', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <HeaderCompactSearch
          variant={HeaderCompactSearchVariant.Inline}
          onClickCancelButton={jest.fn()}
          textFieldSearchProps={{
            ...defaultSearchProps,
            onChangeText,
          }}
        />,
      );

      const input = getByPlaceholderText('Search');
      fireEvent.change(input, { target: { value: 'test query' } });

      expect(onChangeText).toHaveBeenCalledWith('test query');
    });
  });

  describe('className', () => {
    it('applies custom className to root element', () => {
      const { container } = render(
        <HeaderCompactSearch
          variant={HeaderCompactSearchVariant.Screen}
          onClickBackButton={jest.fn()}
          className="custom-class"
          textFieldSearchProps={defaultSearchProps}
        />,
      );

      expect(
        container.querySelector('header.mm-header-compact-search.custom-class'),
      ).toBeDefined();
    });
  });
});
