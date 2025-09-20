import React from 'react';
import { HelpTextProps } from '../../component-library/help-text';
import { LabelProps } from '../../component-library/label';
import {
  BoxProps,
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../../component-library/box';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface FileUploaderStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the FileUploader component
   */
  className?: string;
  /*
   * helpText to be rendered below the File uploader box
   */
  helpText?: string | React.ReactNode;
  /*
   * props to be passed to the HelpText component
   */
  helpTextProps?: Partial<HelpTextProps<'div'>>;
  /*
   * props to be passed to the FileUploader box
   */
  fileUploaderProps?: Partial<BoxProps<'button'>>;
  /*
   * accept to be passed to the FileUploader input
   */
  accept?: string;
  /*
   * acceptInfo to be rendered below the FileUploader description
   */
  acceptInfo?: string;
  /*
   * error state to show danger severity in help text
   */
  error?: boolean;
  /*
   * maxFileSize to be passed to the FileUploader input in MB
   */
  maxFileSize?: number;
  /*
   * props to be passed to the files container
   */
  filesProps?: Partial<BoxProps<'div'>>;
  /*
   * onChange to be passed to the FileUploader input
   */
  onChange?: (files: FileList | null) => void;
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface FileUploaderWithLabelProps
  extends FileUploaderStyleUtilityProps {
  /*
   * label to be rendered above the FileUploader box
   * if label is provided, id is required
   */
  label: string | React.ReactNode;
  /*
   * props to be passed to the Label component
   */
  labelProps?: Partial<LabelProps<'label'>>;
  id: string; // id is required when label is provided
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface FileUploaderWithoutLabelProps
  extends FileUploaderStyleUtilityProps {
  /*
   * This is for when label is not provided, that way we can optionally still pass an id
   */
  label?: never;
  labelProps?: never;
  id?: string; // id is optional when label is not provided
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type FileUploaderProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<
    C,
    FileUploaderWithLabelProps | FileUploaderWithoutLabelProps
  >;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type FileUploaderComponent = <C extends React.ElementType = 'div'>(
  props: FileUploaderProps<C>,
) => React.ReactElement | null;
