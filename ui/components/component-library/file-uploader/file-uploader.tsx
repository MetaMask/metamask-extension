import React, { useEffect, useState } from 'react';
import FileInput from 'react-simple-file-input';
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
import { Label } from '../label';
import { HelpText, HelpTextSeverity } from '../help-text';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { FileUploaderProps } from './file-uploader.types';

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
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = (newFiles: FileList | File) => {
    setError(null);
    const isFileList = newFiles instanceof FileList;
    if (!newFiles || (isFileList && !newFiles?.length)) {
      return;
    }

    const existingFileNames = new Set(
      files ? Array.from(files).map((f) => f.name) : [],
    );

    // Filter out duplicates and validate file size
    const validFiles: File[] = [];

    if (isFileList) {
      Array.from(newFiles).forEach((file) => {
        // Skip if duplicate
        if (existingFileNames.has(file.name)) {
          return;
        }

        // Check if file type is supported
        // only happens on drag and drop since it does not check access prop
        // remove whitespace from accept
        const acceptArray = accept?.replaceAll(' ', '').split(',');
        if (accept && acceptArray && !acceptArray.includes(file.type)) {
          setError(t('fileUploaderInvalidFileTypeError'));
          return;
        }

        // Check file size if maxFileSize(in bytes) is specified
        if (maxFileSize && file.size > maxFileSize) {
          const fileSizeInMB = parseFloat(
            (maxFileSize / 1024 / 1024).toFixed(2),
          );
          setError(t('fileUploaderMaxFileSizeError', [fileSizeInMB]));
          return;
        }

        validFiles.push(file);
      });
    } else {
      if (existingFileNames.has(newFiles.name)) {
        return;
      }

      if (maxFileSize && newFiles.size > maxFileSize) {
        const fileSizeInMB = parseFloat((maxFileSize / 1024 / 1024).toFixed(2));
        setError(t('fileUploaderMaxFileSizeError', [fileSizeInMB]));
        return;
      }
      validFiles.push(newFiles);
    }

    if (!validFiles.length) {
      return;
    }

    const dt = new DataTransfer();
    // Add existing files first
    if (files) {
      Array.from(files).forEach((f) => dt.items.add(f));
    }

    // Add new valid files
    validFiles.forEach((f) => dt.items.add(f));

    setFiles(dt.files);
  };

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

  // emit the files to parent when they change
  useEffect(() => {
    onChange?.(files);
  }, [files, onChange]);

  const inputId = id || 'file-uploader-input';

  const handleClick = () => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    input?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Box flexDirection={BoxFlexDirection.Column} {...props}>
      {label && (
        <Label
          htmlFor={inputId}
          {...labelProps}
          className={twMerge('mb-1', labelProps?.className ?? '')}
        >
          {label}
        </Label>
      )}
      <FileInput
        id={inputId}
        data-testid="file-uploader-input"
        accept={accept ?? undefined}
        multiple
        {...fileInputProps}
        className={twMerge('sr-only', fileInputProps?.className ?? '')}
        onChange={onFileChange}
        // don't save the value to the input field to allow reuploading the same file
        value={''}
      />
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
          dropAreaProps?.className,
        )}
        tabIndex={0}
      >
        <Icon
          name={IconName.Upload}
          size={IconSize.Xl}
          color={IconColor.IconAlternative}
        />
        <Box flexDirection={BoxFlexDirection.Column}>
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
                  file.type.includes('image') ? IconName.Image : IconName.File
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
                  setFiles(
                    (() => {
                      const dt = new DataTransfer();
                      Array.from(files)
                        .filter((f) => f.name !== file.name)
                        .forEach((f) => dt.items.add(f));
                      return dt.files;
                    })(),
                  );
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
