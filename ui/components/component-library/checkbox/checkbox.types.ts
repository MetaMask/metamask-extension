import type { StyleUtilityProps } from '../box';
import type { TextProps } from '../text';

export interface CheckboxProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the Checkbox component
   */
  className?: string;
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
   * title - the title for the Checkbox
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
   * label - the label for the Checkbox
   */
  label?: string;
  /*
   * textProps - additional props to be spread to the label
   */
  textProps?: TextProps;
}
