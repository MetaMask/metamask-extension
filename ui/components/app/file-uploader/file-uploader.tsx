import React from 'react';
import classnames from 'classnames';
import {
  AlignItems,
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
import { Icon, IconName, IconSize, Text } from '../../component-library';

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
    const onFileDrop = (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      console.log('check: onFileDrop', file);
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      console.log('check: onFileChange', file);
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
          <input
            id="file-uploader-input"
            type="file"
            className="hidden"
            multiple={true}
            onChange={onFileChange}
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
      </Box>
    );
  },
);
