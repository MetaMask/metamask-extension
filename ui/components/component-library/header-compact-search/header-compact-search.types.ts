import React from 'react';
import type { BoxProps } from '@metamask/design-system-react';
import type { ButtonIconProps } from '@metamask/design-system-react';
import type { ButtonProps } from '@metamask/design-system-react';
import type { TextFieldSearchStyleUtilityProps } from '../text-field-search/text-field-search.types';

export enum HeaderCompactSearchVariant {
  Screen = 'screen',
  Inline = 'inline',
}

export interface HeaderCompactSearchTextFieldSearchProps
  extends Omit<
    TextFieldSearchStyleUtilityProps,
    'onChange' | 'clearButtonOnClick'
  > {
  onChangeText?: (text: string) => void;
  onClickClearButton?: () => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearButtonOnClick?: () => void;
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface HeaderCompactSearchBaseProps
  extends Pick<
    BoxProps,
    | 'className'
    | 'gap'
    | 'padding'
    | 'paddingLeft'
    | 'paddingRight'
    | 'paddingHorizontal'
    | 'margin'
    | 'flexDirection'
    | 'alignItems'
    | 'justifyContent'
  > {
  textFieldSearchProps: HeaderCompactSearchTextFieldSearchProps;
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface HeaderCompactSearchScreenProps
  extends HeaderCompactSearchBaseProps {
  variant: HeaderCompactSearchVariant.Screen;
  onClickBackButton: () => void;
  backButtonProps?: Partial<Omit<ButtonIconProps, 'ref'>>;
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface HeaderCompactSearchInlineProps
  extends HeaderCompactSearchBaseProps {
  variant: HeaderCompactSearchVariant.Inline;
  onClickCancelButton: () => void;
  cancelButtonProps?: Partial<
    Omit<ButtonProps, 'children' | 'ref' | 'variant'>
  >;
}

export type HeaderCompactSearchProps =
  | HeaderCompactSearchScreenProps
  | HeaderCompactSearchInlineProps;
