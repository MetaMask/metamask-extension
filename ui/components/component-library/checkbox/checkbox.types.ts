import { IconProps } from '../icon';
import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export interface CheckboxStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the Checkbox component
   */
  className?: string;
  /*
   * id - the id for the Checkbox and used for the htmlFor attribute of the label
   */
  id?: string;
  /*
   * isDisabled - if true, the Checkbox will be disabled
   */
  isDisabled?: boolean;
  /*
   * isChecked - if true, the Checkbox will be checked
   */
  isChecked?: boolean;
  /*
   * isIndeterminate - if true, the Checkbox will be indeterminate
   */
  isIndeterminate?: boolean;
  /*
   *  isReadOnly - if true, the Checkbox will be read only
   */
  isReadOnly?: boolean;
  /*
   * isRequired - if true, the Checkbox will be required
   */
  isRequired?: boolean;
  /*
   * title can help add additional context to the Checkbox for screen readers and will work for native tooltip elements
   * if no title is passed, then it will try to use the label prop if it is a string
   */
  title?: string;
  /*
   * name - to identify the checkbox and associate it with its value during form submission
   */
  name?: string;
  /*
   * onChange - the function to call when the Checkbox is changed
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /*
   * label is the string or ReactNode to be rendered next to the Checkbox
   */
  label?: any;
  /*
   * Use inputProps for additional props to be spread to the checkbox input element
   */
  inputProps?: any; // TODO: Replace with Box types when the syntax and typing is properly figured out. Needs to accept everything Box accepts
  /*
   * Use inputRef to pass a ref to the html input element
   */
  inputRef?:
    | React.RefObject<HTMLInputElement>
    | ((instance: HTMLInputElement | null) => void);
  /*
   * iconProps - additional props to be spread to the Icon component used for the Checkbox
   */
  iconProps?: IconProps<'span'>;
}

export type CheckboxProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, CheckboxStyleUtilityProps>;

export type CheckboxComponent = <C extends React.ElementType = 'div'>(
  props: CheckboxProps<C>,
) => React.ReactElement | null;
