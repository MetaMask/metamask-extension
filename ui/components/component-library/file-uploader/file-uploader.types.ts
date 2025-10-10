import PropTypes from 'prop-types';
import { FileInputProps } from 'react-simple-file-input';
import { BoxProps } from '@metamask/design-system-react';
import { HelpTextProps } from '../help-text';
import { LabelProps } from '../label';

export type FileUploaderProps = Omit<Partial<BoxProps>, 'children' | 'ref'> & {
  /*
   * ID for the file input (required if label is provided)
   */
  id?: string;
  /*
   * Label to be rendered above the FileUploader
   */
  label?: string | PropTypes.ReactNodeLike;
  /*
   * Props to be passed to the Label component
   */
  labelProps?: Partial<LabelProps<'label'>>;
  /*
   * Help text to be rendered below the File uploader
   */
  helpText?: string | PropTypes.ReactNodeLike;
  /*
   * Props to be passed to the HelpText component
   */
  helpTextProps?: Partial<HelpTextProps<'div'>>;
  /*
   * Props to be passed to the FileUploader drop area container
   */
  dropAreaProps?: Partial<BoxProps>;
  /*
   * Accepted file types (MIME types)
   */
  accept?: FileInputProps['accept'];
  /*
   * Text to show accepted file types
   */
  acceptText?: string;
  /*
   * Maximum file size in bytes
   */
  maxFileSize?: number;
  /*
   * Props to be passed to the FileInput component
   */
  fileInputProps?: Partial<FileInputProps>;
  /*
   * Callback when files are selected
   */
  onChange?: (files: FileList | null) => void;
};
