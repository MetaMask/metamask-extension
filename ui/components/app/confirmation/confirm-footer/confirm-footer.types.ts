import type { StyleUtilityProps } from '../../../component-library/box';
import type { ButtonProps } from '../../../component-library/button';

export interface ConfirmFooterProps
  extends Omit<StyleUtilityProps, 'className'> {
  /**
   * Additional className to assign the ConfirmFooter component
   */
  className?: string;
  /**
   * The cancel button text
   */
  cancelText?: string;
  /**
   * The confirm button text
   */
  confirmText?: string;
  /**
   * The cancel button click handler
   */
  onCancel: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * The confirm button click handler
   */
  onConfirm: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * The props to pass to the cancel button
   */
  cancelButtonProps?: ButtonProps<'button'>;
  /**
   * The props to pass to the confirm button
   */
  confirmButtonProps?: ButtonProps<'button'>;
}
