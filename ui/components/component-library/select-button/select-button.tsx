import React, { useContext } from 'react';
import classnames from 'classnames';
import { SelectContext } from '../select-wrapper';
import type { PolymorphicRef } from '../box';
import { Text, Icon, IconName, IconSize } from '..';
import type { TextProps } from '../text';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
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
      size = SelectButtonSize.Md,
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

    const getPaddingBySize = () => {
      switch (size) {
        case SelectButtonSize.Sm:
          return 1;
        case SelectButtonSize.Md:
          return 2;
        case SelectButtonSize.Lg:
          return 3;
        default:
          return 1;
      }
    };

    return (
      <Text
        className={classnames(
          'mm-select-button',
          {
            'mm-select-button--type-danger': isDanger,
            'mm-select-button--disabled': isDisabled,
            'mm-select-button--open': isOpen || isUncontrolledOpen,
            [`mm-select-button--size-${size}`]:
              Object.values(SelectButtonSize).includes(size),
          } as Record<string, boolean>, // To Do: In SelectButton PR confirm and adjust this
          className,
        )}
        ref={ref}
        disabled={isDisabled}
        as="button"
        onClick={onClick || toggleUncontrolledOpen}
        borderColor={
          isDanger ? BorderColor.errorDefault : BorderColor.borderDefault
        }
        borderRadius={BorderRadius.MD}
        backgroundColor={BackgroundColor.backgroundDefault}
        paddingTop={getPaddingBySize()}
        paddingBottom={getPaddingBySize()}
        paddingLeft={4}
        paddingRight={4}
        display={Display.Flex}
        height={BlockSize.Full}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        gap={2}
        {...(props as TextProps<C>)}
      >
        <span>{contentToRender}</span>
        <Icon name={IconName.ArrowDown} size={IconSize.Sm} />
      </Text>
    );
  },
);
