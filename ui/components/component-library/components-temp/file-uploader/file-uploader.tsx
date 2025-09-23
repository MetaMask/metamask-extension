import React, { useEffect, useState } from 'react';
import FileInput from 'react-simple-file-input';
import classnames from 'classnames';
import { ButtonIconSize } from '@metamask/design-system-react';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Box, PolymorphicRef } from '../../box';
import type { BoxProps } from '../../box';
import { Label } from '../../label';
import { HelpText, HelpTextSeverity } from '../../help-text';
import { ButtonIcon, Icon, IconName, IconSize, Text } from '../..';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  FileUploaderProps,
  FileUploaderComponent,
} from './file-uploader.types';

export const FileUploader: FileUploaderComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      helpText,
      helpTextProps,
      id,
      label,
      labelProps,
      fileUploaderProps,
      accept,
      acceptInfo,
      maxFileSize,
      filesProps,
      onChange,
      ...props
    }: FileUploaderProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const t = useI18nContext();
    const [files, setFiles] = useState<FileList | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const addFiles = (newFiles: FileList) => {
      setError(null);
      if (!newFiles?.length) {
        return;
      }

      const existingFileNames = new Set(
        files ? Array.from(files).map((f) => f.name) : [],
      );

      // Filter out duplicates and validate file size
      const validFiles: File[] = [];

      Array.from(newFiles).forEach((file) => {
        // Skip if duplicate
        if (existingFileNames.has(file.name)) {
          return;
        }

        // Check file size if maxFileSize is specified (in kilobytes)
        if (maxFileSize && file.size > maxFileSize * 1024 * 1024) {
          setError(t('fileUploaderMaxFileSizeError', [maxFileSize]));
          return;
        }

        validFiles.push(file);
      });

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

    const onFileDrop = (e: React.DragEvent<HTMLButtonElement>) => {
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

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        ref={ref}
        {...(props as BoxProps<'div'>)}
      >
        {label && (
          <Label
            htmlFor={id}
            marginBottom={1}
            {...labelProps}
            className={labelProps?.className ?? ''}
          >
            {label}
          </Label>
        )}
        <Label
          htmlFor="file-uploader-input"
          className={classnames('file-uploader-label', {
            'file-uploader-label--dragging': isDragging,
          })}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          width={BlockSize.Full}
          padding={6}
          gap={2}
          textAlign={TextAlign.Center}
          borderRadius={BorderRadius.LG}
          borderWidth={1}
          onDragOver={(e: React.DragEvent<HTMLButtonElement>) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e: React.DragEvent<HTMLButtonElement>) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={onFileDrop}
          {...fileUploaderProps}
        >
          <Icon
            name={IconName.Upload}
            size={IconSize.Xl}
            color={IconColor.iconAlternativeSoft}
          />
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternativeSoft}
            >
              {t('fileUploaderDescription')}
            </Text>
            {acceptInfo && (
              <Text
                variant={TextVariant.bodySmMedium}
                color={TextColor.textAlternativeSoft}
              >
                {acceptInfo}
              </Text>
            )}
          </Box>

          <FileInput
            id="file-uploader-input"
            data-testid="file-uploader-input"
            onChange={onFileChange}
            className="hidden"
            multiple
            // don't save the value to the input field to allow reuploading the same file
            value={''}
            accept={accept ?? undefined}
          />
        </Label>
        {(error || helpText) && (
          <HelpText
            severity={error ? HelpTextSeverity.Danger : undefined}
            marginTop={1}
            {...helpTextProps}
            className={classnames(
              'mm-form-text-field__help-text',
              helpTextProps?.className ?? '',
            )}
          >
            {error || helpText}
          </HelpText>
        )}
        {files && (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
            marginTop={4}
            {...filesProps}
          >
            {Array.from(files).map((file) => (
              <Box
                key={file.name}
                display={Display.Flex}
                alignItems={AlignItems.center}
                flexDirection={FlexDirection.Row}
                borderRadius={BorderRadius.LG}
                backgroundColor={BackgroundColor.backgroundSection}
                paddingTop={2}
                paddingBottom={2}
                paddingInline={4}
              >
                <Icon
                  name={
                    file.type.includes('image') ? IconName.Image : IconName.File
                  }
                  size={IconSize.Md}
                  color={IconColor.iconAlternative}
                  marginRight={2}
                />
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                >
                  {file.name}
                </Text>
                <ButtonIcon
                  iconName={IconName.Close}
                  size={ButtonIconSize.Sm}
                  color={IconColor.iconAlternative}
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
                  marginLeft="auto"
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  },
);
