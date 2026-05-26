import React from 'react';
import type { BoxProps, ButtonIconProps } from '@metamask/design-system-react';
import type { TextFieldSearchStyleUtilityProps } from '../text-field-search/text-field-search.types';

export enum HeaderSearchVariant {
  Screen = 'screen',
  Inline = 'inline',
}

export type HeaderSearchTextFieldSearchProps = Omit<
  TextFieldSearchStyleUtilityProps,
  'onChange' | 'clearButtonOnClick'
> & {
  onChangeText?: (text: string) => void;
  onClickClearButton?: () => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearButtonOnClick?: () => void;
};

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface HeaderSearchBaseProps
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
  textFieldSearchProps: HeaderSearchTextFieldSearchProps;
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface HeaderSearchScreenProps extends HeaderSearchBaseProps {
  variant: HeaderSearchVariant.Screen;
  onClickBackButton: () => void;
  backButtonProps?: Partial<Omit<ButtonIconProps, 'ref'>>;
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface HeaderSearchInlineProps extends HeaderSearchBaseProps {
  variant: HeaderSearchVariant.Inline;
  onClickCancelButton: () => void;
  cancelButtonProps?: Partial<Omit<ButtonIconProps, 'ref'>>;
}

export type HeaderSearchProps =
  | HeaderSearchScreenProps
  | HeaderSearchInlineProps;
