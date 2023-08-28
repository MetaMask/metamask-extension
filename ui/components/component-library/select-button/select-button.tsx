import React, { useContext } from 'react';
import classnames from 'classnames';
import { SelectContext } from '../select-wrapper/select-wrapper';
import type { PolymorphicRef, BoxProps } from '../box';
import { Box, Icon, IconName, IconSize } from '..';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  SelectButtonProps,
  SelectButtonComponent,
  SelectButtonSize,
} from './select-button.types';

export const SelectButton: SelectButtonComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      className = '',
      placeholder,
      children,
      size = SelectButtonSize.Auto,
      onClick,
      ...props
    }: SelectButtonProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const selectContext = useContext(SelectContext);

    if (!selectContext) {
      throw new Error('SelectButton must be used within a SelectWrapper.');
    }

    const {
      isOpen,
      isUncontrolledOpen,
      toggleUncontrolledOpen,
      isDanger,
      isDisabled,
      value,
      uncontrolledValue,
      defaultValue,
      placeholder: WrapperPlaceholder,
    } = selectContext;

    const contentToRender =
      value ||
      uncontrolledValue ||
      defaultValue ||
      placeholder ||
      WrapperPlaceholder ||
      children;

    return (
      <Box
        className={classnames(
          'mm-select-button',
          {
            'mm-select-button--danger': isDanger,
            'mm-select-button--disabled': isDisabled,
            'mm-select-button--open': isOpen || isUncontrolledOpen,
            [`mm-select-button--size-${size}`]:
              Object.values(SelectButtonSize).includes(size),
          },
          className,
        )}
        ref={ref}
        {...(props as BoxProps<C>)}
        disabled={isDisabled}
        as="button"
        onClick={onClick || toggleUncontrolledOpen}
        borderColor={
          isDanger ? BorderColor.errorDefault : BorderColor.borderDefault
        }
        borderRadius={BorderRadius.MD}
        backgroundColor={BackgroundColor.backgroundDefault}
        paddingLeft={4}
        paddingRight={4}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        gap={2}
        style={{ width: '100%' }}
      >
        <span>{contentToRender}</span>
        <Icon name={IconName.ArrowDown} size={IconSize.Sm} />
      </Box>
    );
  },
);
