import React from 'react';
import {
  TextFieldSearch,
  TextFieldSize,
  type TextFieldSearchProps,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const PILL_TEXT_FIELD_SEARCH_CLASSNAME =
  'mm-text-field-search w-full rounded-full border border-border-muted bg-background-default';

export type PillTextFieldSearchProps = Omit<
  TextFieldSearchProps,
  'clearButtonOnClick' | 'size'
> & {
  onClear: () => void;
  size?: TextFieldSize;
};

export const PillTextFieldSearch = ({
  onClear,
  size = TextFieldSize.Lg,
  className,
  clearButtonProps,
  ...props
}: PillTextFieldSearchProps) => {
  const t = useI18nContext();

  return (
    <TextFieldSearch
      {...props}
      size={size}
      className={
        className
          ? `${PILL_TEXT_FIELD_SEARCH_CLASSNAME} ${className}`
          : PILL_TEXT_FIELD_SEARCH_CLASSNAME
      }
      clearButtonOnClick={onClear}
      clearButtonProps={{ ariaLabel: t('clear'), ...clearButtonProps }}
    />
  );
};
