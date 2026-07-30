import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { HeaderSearch } from './header-search';
import { HeaderSearchVariant } from './header-search.types';

describe('HeaderSearch', () => {
  const defaultSearchProps = {
    value: '',
    placeholder: messages.search.message,
  };

  describe('Screen variant', () => {
    it('renders back button and search input', () => {
      const onClickBackButton = jest.fn();
      const { getByRole, getByPlaceholderText } = render(
        <HeaderSearch
          variant={HeaderSearchVariant.Screen}
          onClickBackButton={onClickBackButton}
          textFieldSearchProps={{
            ...defaultSearchProps,
            inputProps: { 'data-testid': 'header-search-input' },
          }}
        />,
      );

      const backButton = getByRole('button');
      expect(backButton).toBeDefined();
      expect(getByPlaceholderText(messages.search.message)).toBeDefined();
      expect(backButton.closest('header')).toHaveClass('mm-header-search');
    });

    it('invokes callback when back button is clicked', () => {
      const onClickBackButton = jest.fn();
      const { getByRole } = render(
        <HeaderSearch
          variant={HeaderSearchVariant.Screen}
          onClickBackButton={onClickBackButton}
          textFieldSearchProps={defaultSearchProps}
        />,
      );

      fireEvent.click(getByRole('button'));

      expect(onClickBackButton).toHaveBeenCalledTimes(1);
    });
  });

  describe('Inline variant', () => {
    it('renders search input and close button', () => {
      const onClickCancelButton = jest.fn();
      const { getByRole, getByPlaceholderText } = render(
        <HeaderSearch
          variant={HeaderSearchVariant.Inline}
          onClickCancelButton={onClickCancelButton}
          textFieldSearchProps={defaultSearchProps}
        />,
      );

      expect(getByPlaceholderText(messages.search.message)).toBeDefined();
      expect(getByRole('button')).toBeDefined();
    });

    it('invokes callback when close button is clicked', () => {
      const onClickCancelButton = jest.fn();
      const { getByRole } = render(
        <HeaderSearch
          variant={HeaderSearchVariant.Inline}
          onClickCancelButton={onClickCancelButton}
          textFieldSearchProps={defaultSearchProps}
        />,
      );

      fireEvent.click(getByRole('button'));

      expect(onClickCancelButton).toHaveBeenCalledTimes(1);
    });
  });

  describe('textFieldSearchProps', () => {
    it('invokes onChangeText with input value when user types', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <HeaderSearch
          variant={HeaderSearchVariant.Inline}
          onClickCancelButton={jest.fn()}
          textFieldSearchProps={{
            ...defaultSearchProps,
            onChangeText,
          }}
        />,
      );

      const input = getByPlaceholderText(messages.search.message);
      fireEvent.change(input, { target: { value: 'test query' } });

      expect(onChangeText).toHaveBeenCalledWith('test query');
    });
  });

  describe('className', () => {
    it('applies custom className to root element', () => {
      const { container } = render(
        <HeaderSearch
          variant={HeaderSearchVariant.Screen}
          onClickBackButton={jest.fn()}
          className="custom-class"
          textFieldSearchProps={defaultSearchProps}
        />,
      );

      expect(
        container.querySelector('header.mm-header-search.custom-class'),
      ).toBeInTheDocument();
    });
  });
});
