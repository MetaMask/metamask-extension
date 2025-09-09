declare module 'react-simple-file-input' {
  import React from 'react';

  /**
   * Event object passed to onLoad callback when file is read
   */
  type FileLoadEvent = {
    target: {
      result: string | ArrayBuffer | null;
    };
  };

  /**
   * Props for the react-simple-file-input FileInput component
   */
  type FileInputProps = {
    /**
     * Callback fired when files are selected
     *
     * @param files - The selected files
     */
    onChange?: (files: FileList) => void;

    /**
     * Callback fired when file content is loaded (when readAs is specified)
     *
     * @param event - Event containing the file content in event.target.result
     */
    onLoad?: (event: FileLoadEvent) => void;

    /**
     * How to read the file content. When specified, onLoad will be called with the result
     * - 'text': Read as text string
     * - 'dataURL': Read as data URL
     * - 'arrayBuffer': Read as ArrayBuffer
     * - 'binaryString': Read as binary string
     */
    readAs?: 'text' | 'dataURL' | 'arrayBuffer' | 'binaryString';

    /**
     * Whether to allow multiple file selection
     */
    multiple?: boolean;

    /**
     * File types to accept (MIME types)
     */
    accept?: string;

    /**
     * Input value (usually empty string to reset)
     */
    value?: string;

    /**
     * CSS class name
     */
    className?: string;

    /**
     * Inline styles
     */
    style?: React.CSSProperties;

    /**
     * Element ID
     */
    id?: string;

    /**
     * Test ID for testing
     */
    'data-testid'?: string;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onLoad'>;

  /**
   * FileInput component from react-simple-file-input
   */
  const FileInput: React.FC<FileInputProps>;

  export default FileInput;
}
