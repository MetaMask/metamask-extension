import React, { useState } from 'react';
import FileInput from 'react-simple-file-input';
import classnames from 'classnames';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, PolymorphicRef } from '../../../components/component-library/box';
import type { BoxProps } from '../../../components/component-library/box';
import { Label } from '../../../components/component-library/label';
import {
  HelpText,
  HelpTextSeverity,
} from '../../../components/component-library/help-text';
import {
  FileUploaderProps,
  FileUploaderComponent,
} from './file-uploader.types';
import {
  ButtonIcon,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import { ButtonIconSize } from '@metamask/design-system-react';

export const FileUploader: FileUploaderComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      error,
      helpText,
      helpTextProps,
      id,
      label,
      labelProps,
      fileUploaderProps,
      ...props
    }: FileUploaderProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const [files, setFiles] = useState<FileList | null>(null);

    const addFiles = (newFiles: FileList) => {
      const newFileList = Array.from(newFiles ?? []).filter(
        (f) => !Array.from(files ?? []).some((f2) => f2.name === f.name),
      );

      const dt = new DataTransfer();
      const allFiles = [
        ...Array.from(files ?? []),
        ...Array.from(newFileList ?? []),
      ];
      Array.from(allFiles).forEach((f) => dt.items.add(f));
      setFiles(dt.files);
    };

    const onFileDrop = (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const { files } = e.dataTransfer;
      console.log('check: onFileDrop', files);
      addFiles(files);
    };

    const onFileChange = (files: FileList) => {
      if (!files) return;
      addFiles(files);
    };

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
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          width={BlockSize.Full}
          gap={2}
          padding={6}
          textAlign={TextAlign.Center}
          borderStyle={BorderStyle.dashed}
          borderColor={BorderColor.borderDefault}
          borderRadius={BorderRadius.LG}
          borderWidth={1}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={onFileDrop}
          {...fileUploaderProps}
        >
          <Icon
            name={IconName.CloudUpload}
            size={IconSize.Xl}
            color={IconColor.iconAlternativeSoft}
          />
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternativeSoft}
          >
            <Text
              as="span"
              variant={TextVariant.inherit}
              fontWeight={FontWeight.Medium}
              color={TextColor.textAlternativeSoft}
            >
              Click to upload
            </Text>{' '}
            or drag and drop
          </Text>
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternativeSoft}
          >
            PDF, PNG, JPG (MAX. 5MB)
          </Text>

          <FileInput
            id="file-uploader-input"
            data-testid="file-uploader-input"
            onChange={onFileChange}
            className="hidden"
            multiple
            // don't save the value to the input field to allow reuploading the same file
            value={''}
            accept={[
              'application/pdf',
              'image/png',
              'image/jpg',
              'image/jpeg',
            ].join(',')}
          />
        </Label>
        {helpText && (
          <HelpText
            severity={error ? HelpTextSeverity.Danger : undefined}
            marginTop={1}
            {...helpTextProps}
            className={classnames(
              'mm-form-text-field__help-text',
              helpTextProps?.className ?? '',
            )}
          >
            {helpText}
          </HelpText>
        )}
        {files && (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
            marginTop={4}
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
                    file.type.includes('pdf') ? IconName.File : IconName.Image
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
                  ariaLabel="Remove file"
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
