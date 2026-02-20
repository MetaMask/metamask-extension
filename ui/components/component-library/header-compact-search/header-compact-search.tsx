import React from 'react';
import classnames from 'classnames';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonVariant,
  IconName,
  TextColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TextFieldSearch } from '../text-field-search';
import {
  HeaderCompactSearchProps,
  HeaderCompactSearchVariant,
} from './header-compact-search.types';

function adaptTextFieldSearchProps(
  props: HeaderCompactSearchProps['textFieldSearchProps'],
) {
  const {
    onChangeText,
    onClickClearButton,
    onChange,
    clearButtonOnClick,
    ...rest
  } = props;
  return {
    ...rest,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      onChangeText?.(e.target.value);
      onChange?.(e);
    },
    clearButtonOnClick: () => {
      onClickClearButton?.();
      clearButtonOnClick?.();
    },
  };
}

export const HeaderCompactSearch: React.FC<HeaderCompactSearchProps> = (
  props,
) => {
  const t = useI18nContext();
  const { variant, className = '', textFieldSearchProps, ...rest } = props;
  const searchProps = adaptTextFieldSearchProps(textFieldSearchProps);

  const searchBox = (
    <Box className="flex-1 min-w-0 flex items-center">
      <TextFieldSearch
        {...searchProps}
        className={classnames('w-full', searchProps.className ?? '')}
      />
    </Box>
  );

  const rootClassName = classnames(
    'mm-header-compact-search w-full flex flex-row items-center gap-2 px-4',
    className,
  );

  const baseLayoutProps = {
    flexDirection: BoxFlexDirection.Row as const,
    alignItems: BoxAlignItems.Center,
    gap: 2 as const,
    paddingHorizontal: 4 as const,
  };

  if (variant === HeaderCompactSearchVariant.Screen) {
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
        <Button
          variant={ButtonVariant.Tertiary}
          onClick={onClickCancelButton}
          textProps={{ color: TextColor.TextDefault }}
          {...cancelButtonProps}
        >
          {t('cancel')}
        </Button>
      </Box>
    </header>
  );
};
