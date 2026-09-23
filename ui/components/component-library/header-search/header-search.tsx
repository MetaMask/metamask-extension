import React from 'react';
import classnames from 'clsx';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  TextFieldSearch,
  TextFieldSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { HeaderSearchProps, HeaderSearchVariant } from './header-search.types';

function adaptTextFieldSearchProps(
  props: HeaderSearchProps['textFieldSearchProps'],
) {
  const {
    onChangeText,
    onClickClearButton,
    onChange,
    clearButtonOnClick,
    className,
    size = TextFieldSize.Md,
    ...rest
  } = props;

  return {
    ...rest,
    size,
    className: classnames('w-full', className),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      onChangeText?.(e.target.value);
      onChange?.(e);
    },
    clearButtonOnClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      onClickClearButton?.();
      clearButtonOnClick?.(e);
    },
  };
}

export const HeaderSearch = (props: HeaderSearchProps) => {
  const t = useI18nContext();
  const { variant, className = '', textFieldSearchProps } = props;
  const searchProps = adaptTextFieldSearchProps(textFieldSearchProps);

  const searchBox = (
    <Box className="flex min-w-0 flex-1 items-center">
      <TextFieldSearch {...searchProps} />
    </Box>
  );

  const rootClassName = classnames('mm-header-search w-full', className);

  const baseLayoutProps = {
    flexDirection: BoxFlexDirection.Row,
    alignItems: BoxAlignItems.Center,
    gap: 2 as const,
    paddingHorizontal: 4 as const,
  };

  if (variant === HeaderSearchVariant.Screen) {
    const {
      onClickBackButton,
      backButtonProps,
      variant: _variant,
      className: _className,
      textFieldSearchProps: _textFieldSearchProps,
      ...boxProps
    } = props;
    return (
      <header className={rootClassName}>
        <Box {...baseLayoutProps} {...boxProps} className="w-full">
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            ariaLabel={t('back')}
            size={ButtonIconSize.Md}
            onClick={onClickBackButton}
            {...backButtonProps}
          />
          {searchBox}
        </Box>
      </header>
    );
  }

  const {
    onClickCancelButton,
    cancelButtonProps,
    variant: _variant,
    className: _className,
    textFieldSearchProps: _textFieldSearchProps,
    ...boxProps
  } = props;
  return (
    <header className={rootClassName}>
      <Box {...baseLayoutProps} {...boxProps} className="w-full">
        {searchBox}
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close')}
          size={ButtonIconSize.Md}
          onClick={onClickCancelButton}
          {...cancelButtonProps}
        />
      </Box>
    </header>
  );
};
