import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';
import { IconProps } from '../icon';
import { LabelStyleUtilityProps } from '../label/label.types';
import { TextStyleUtilityProps } from '../text';

export enum SelectButtonSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface SelectButtonStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the SelectButton component
   */
  className?: string;
  /**
   * The size of the SelectButton using SelectButtonSize enum
   * Possible values: 'SelectButtonSize.Sm', 'SelectButtonSize.Md', 'SelectButtonSize.Lg'
   */
  size?: SelectButtonSize;
  /*
   * Placeholder for SelectButton component
   * Using the example prop shape recommendation will help utilize the structure of this component:
   * {
   *   label: 'Label',
   *   description: 'Description',
   *   startAccessory: <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" size={AvatarAccountSize.Sm} />,
   *   endAccessory: <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" size={AvatarAccountSize.Sm} />,
   * }
   */
  placeholder?: any;
  /*
   * Value for `SelectButton` component
   * Using the example prop shape recommendation will help utilize the structure of this component:
   * {
   *   label: 'Label',
   *   description: 'Description',
   *   startAccessory: <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" size={AvatarAccountSize.Sm} />,
   *   endAccessory: <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" size={AvatarAccountSize.Sm} />,
   * }
   */
  value?: any;
  /*
   * DefaultValue for SelectButton component
   * Using the example prop shape recommendation will help utilize the structure of this component:
   * {
   *   label: 'Label',
   *   description: 'Description',
   *   startAccessory: <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" size={AvatarAccountSize.Sm} />,
   *   endAccessory: <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" size={AvatarAccountSize.Sm} />,
   * }
   */
  defaultValue?: any;
  /*
   * isBlock boolean prop for SelectButton component to set display to block
   */
  isBlock?: boolean;
  /*
   * isDanger boolean for SelectButton component to set visual state to danger/error
   */
  isDanger?: boolean;
  /*
   * isDisabled boolean for SelectButton component to set visual state to disabled
   */
  isDisabled?: boolean;
  /*
   * Please use the `isDisabled` prop instead, this prop is added only for backwards compatibility and intuitive HTML support
   */
  disabled?: boolean;
  /*
   * label for SelectButton component that will display in the center content with the description below
   */
  label?: string | React.ReactNode;
  /*
   * labelProps to make changes to the label component within SelectButton
   */
  labelProps?: LabelStyleUtilityProps;
  /*
   * description for SelectButton component that will display below the label
   */
  description?: string | React.ReactNode;
  /*
   * descriptionProps to make changes to the label component within SelectButton
   */
  descriptionProps?: TextStyleUtilityProps;
  /*
   * startAccessory for SelectButton component that will display to the start of the content
   */
  startAccessory?: string | React.ReactNode;
  /*
   * endAccessory for SelectButton component that will display to the start of the content
   */
  endAccessory?: string | React.ReactNode;
  /*
   * caretIconProps to make changes to the caret Icon component at the end of SelectButton
   */
  caretIconProps?: IconProps<'span'>;
}

export type SelectButtonProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, SelectButtonStyleUtilityProps>;

export type SelectButtonComponent = <C extends React.ElementType = 'div'>(
  props: SelectButtonProps<C>,
) => React.ReactElement | null;
