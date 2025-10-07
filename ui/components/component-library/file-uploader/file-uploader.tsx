import React, { useEffect, useState, useCallback, useRef } from 'react';
import FileInput, { FileInputRef } from 'react-simple-file-input';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
  twMerge,
} from '@metamask/design-system-react';

// Legacy components
import { Label } from '../label';
import { HelpText, HelpTextSeverity } from '../help-text';
import { TextColor as TextColorLegacy } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { FileUploaderProps } from './file-uploader.types';

// Constants
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;

export const FileUploader = ({
  helpText,
  helpTextProps,
  id,
  label,
  labelProps,
  dropAreaProps,
  accept,
  acceptText,
  maxFileSize,
  fileInputProps,
  onChange,
  ...props
}: FileUploaderProps) => {
  const t = useI18nContext();
  const fileInputRef = useRef<FileInputRef>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Helper function to convert bytes to MB
  const convertBytesToMB = useCallback((bytes: number): number => {
    return parseFloat((bytes / BYTES_PER_MB).toFixed(2));
  }, []);

  // Helper function to create a FileList from an array of Files
  const createFileList = useCallback((fileArray: File[]): FileList => {
    const dt = new DataTransfer();
    fileArray.forEach((file) => dt.items.add(file));
    return dt.files;
  }, []);

  // Helper function to validate a single file
  const validateFile = useCallback(
    (file: File, existingNames: Set<string>): string | null => {
      // Skip if duplicate
      if (existingNames.has(file.name)) {
        return null; // Skip silently
      }

      // Check file type
      if (accept) {
        const acceptArray = accept?.replace(/\s/gu, '').split(',');
        if (!acceptArray.includes(file.type)) {
          return t('fileUploaderInvalidFileTypeError');
        }
      }

      // Check file size
      if (maxFileSize && file.size > maxFileSize) {
        const maxFileSizeInMB = convertBytesToMB(maxFileSize);
        return t('fileUploaderMaxFileSizeError', [maxFileSizeInMB]);
      }

      return null; // File is valid
    },
    [accept, maxFileSize, convertBytesToMB, t],
  );

  const addFiles = useCallback(
    (newFiles: FileList | File) => {
      setError(null);
      const isFileList = newFiles instanceof FileList;
      if (!newFiles || (isFileList && !newFiles?.length)) {
        return;
      }

      const existingFileNames = new Set(
        files ? Array.from(files).map((f) => f.name) : [],
      );

      const filesToProcess = isFileList ? Array.from(newFiles) : [newFiles];
      const validFiles: File[] = [];

      // Validate all files using the extracted validation logic
      for (const file of filesToProcess) {
        const validationError = validateFile(file, existingFileNames);

        if (validationError) {
          setError(validationError);
          return; // Stop processing on first error
        }

        if (!existingFileNames.has(file.name)) {
          validFiles.push(file);
        }
      }

      if (!validFiles.length) {
        return;
      }

      // Combine existing files with new valid files using helper function
      const existingFiles = files ? Array.from(files) : [];
      const allFiles = [...existingFiles, ...validFiles];
      setFiles(createFileList(allFiles));
    },
    [files, validateFile, createFileList],
  );

  const onFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const { files: dtFiles } = e.dataTransfer;
    addFiles(dtFiles);
  };

  const onFileChange = (fileChangeFiles: FileList) => {
    if (!fileChangeFiles) {
      return;
    }
    addFiles(fileChangeFiles);
  };

  // Optimize onChange callback to prevent unnecessary re-renders
  const handleFilesChange = useCallback(
    (newFiles: FileList | null) => {
      onChange?.(newFiles);
    },
    [onChange],
  );

  // emit the files to parent when they change
  useEffect(() => {
    handleFilesChange(files);
  }, [files, handleFilesChange]);

  const inputId = id || 'file-uploader-input';

  const handleClick = () => {
    const inputField = fileInputRef.current?.refs.inputField;
    if (inputField) {
      inputField.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Box {...props}>
      {label && (
        <Label
          htmlFor={inputId}
          {...labelProps}
          className={twMerge('mb-1', labelProps?.className ?? '')}
        >
          {label}
        </Label>
      )}

      <div
        role="button"
        aria-label={label ? undefined : t('fileUploaderDescription')}
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={onFileDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...dropAreaProps}
        className={twMerge(
          'flex flex-col items-center justify-center w-full p-6 gap-2 text-center rounded-lg border border-dashed border-default hover:bg-background-default-hover hover:border-solid cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-default focus:ring-offset-2',
          isDragging && 'bg-background-default-hover border-solid',
          dropAreaProps?.className || '',
        )}
        tabIndex={0}
      >
        <FileInput
          id={inputId}
          ref={fileInputRef}
          data-testid="file-uploader-input"
          accept={accept ?? undefined}
          multiple
          {...fileInputProps}
          className={twMerge('sr-only', fileInputProps?.className ?? '')}
          onChange={onFileChange}
          // don't save the value to the input field to allow reuploading the same file
          value={''}
        />
        <Icon
          name={IconName.Upload}
          size={IconSize.Xl}
          color={IconColor.IconAlternative}
        />
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {t('fileUploaderDescription')}
          </Text>
          {acceptText && (
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
            >
              {acceptText}
            </Text>
          )}
        </Box>
      </div>
      {(error || helpText) && (
        <HelpText
          severity={error ? HelpTextSeverity.Danger : undefined}
          color={TextColorLegacy.textAlternative}
          {...helpTextProps}
          className={twMerge('mt-1', helpTextProps?.className ?? '')}
        >
          {error || helpText}
        </HelpText>
      )}
      {files && (
        <Box flexDirection={BoxFlexDirection.Column} gap={2} marginTop={4}>
          {Array.from(files).map((file) => (
            <Box
              key={file.name}
              alignItems={BoxAlignItems.Center}
              flexDirection={BoxFlexDirection.Row}
              backgroundColor={BoxBackgroundColor.BackgroundSection}
              paddingTop={2}
              paddingBottom={2}
              paddingLeft={4}
              paddingRight={4}
              gap={2}
              className="rounded-lg"
            >
              <Icon
                name={
                  file.type?.includes('image') ? IconName.Image : IconName.File
                }
                size={IconSize.Md}
                color={IconColor.IconAlternative}
              />
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {file.name}
              </Text>
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                color={IconColor.IconAlternative}
                ariaLabel={t('delete')}
                onClick={() => {
                  const remainingFiles = Array.from(files).filter(
                    (f) => f.name !== file.name,
                  );
                  setFiles(createFileList(remainingFiles));
                }}
                className="ml-auto"
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
