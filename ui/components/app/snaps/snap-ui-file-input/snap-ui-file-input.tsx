import React, {
  ChangeEvent,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  DragEvent,
  FunctionComponent,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  HelpText,
  HelpTextSeverity,
  Icon,
  IconName,
  IconSize,
  Label,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export type SnapUIFileInputProps = {
  name: string;
  label?: string;
  form?: string;
  accept?: string[];
  compact?: boolean;
  error?: boolean;
  helpText?: string;
};

/**
 * A file input component, which is used to create a file input field for Snaps
 * user interfaces.
 *
 * @param props - The props of the component.
 * @param props.name - The name of the file input. This is used to identify the
 * file input field in the form data.
 * @param props.label - The label of the file input, which is displayed above
 * the file input field.
 * @param props.form - The name of the form that the file input belongs to. This
 * is used to group the file input field with other form fields.
 * @param props.accept - The types of files that the file input can accept. This
 * is used to filter the files that the user can select when the input field is
 * clicked.
 * @param props.compact - Whether the file input should be displayed in a
 * compact mode. In compact mode, the file input is displayed as a button with
 * an icon.
 * @param props.error - Whether the file input has an error. If the file input
 * has an error, the help text is displayed in red.
 * @param props.helpText - The help text of the file input, which is displayed
 * below the file input field.
 * @returns A file input element.
 */
export const SnapUIFileInput: FunctionComponent<SnapUIFileInputProps> = ({
  name,
  label,
  form,
  accept,
  compact,
  error,
  helpText,
}) => {
  const t = useI18nContext();
  const { handleFileChange } = useSnapInterfaceContext();
  const ref = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);

  const handleClick = () => {
    ref.current?.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFileChange(name, file, form);
  };

  const handleDragOver = (event: DragEvent<HTMLSpanElement>) => {
    event.preventDefault();
    setActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLSpanElement>) => {
    event.preventDefault();
    setActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLSpanElement>) => {
    event.preventDefault();
    setActive(false);

    const file = event.dataTransfer?.files?.[0] ?? null;
    handleFileChange(name, file, form);
  };

  const header = (
    <>
      {label && (
        <Label
          htmlFor={name}
          className={classnames('mm-form-text-field__label')}
        >
          {label}
        </Label>
      )}
      <input
        id={name}
        ref={ref}
        type="file"
        name={name}
        onChange={handleChange}
        accept={accept?.join(',')}
        hidden={true}
      />
    </>
  );

  const footer = (
    <>
      {helpText && (
        <HelpText
          severity={error ? HelpTextSeverity.Danger : undefined}
          marginTop={1}
          className="mm-form-text-field__help-text"
        >
          {helpText}
        </HelpText>
      )}
    </>
  );

  if (compact) {
    return (
      <Box className="snap-ui-renderer__file-input">
        {header}
        <ButtonIcon
          type="button"
          iconName={IconName.Upload}
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Md}
          padding={1}
          backgroundColor={BackgroundColor.backgroundAlternative}
          borderColor={BorderColor.borderMuted}
          borderStyle={BorderStyle.solid}
          borderWidth={1}
          borderRadius={BorderRadius.MD}
          onClick={handleClick}
          ariaLabel={t('uploadFile')}
        />
        {footer}
      </Box>
    );
  }

  return (
    <Box className="snap-ui-renderer__file-input">
      {header}
      <Box
        className="snap-ui-renderer__file-input__drop-zone"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        gap={1}
        paddingTop={5}
        paddingBottom={5}
        textAlign={TextAlign.Center}
        borderColor={BorderColor.borderMuted}
        borderStyle={BorderStyle.solid}
        borderWidth={1}
        borderRadius={BorderRadius.MD}
        style={{
          cursor: 'pointer',
          backgroundColor: active
            ? 'var(--color-background-default-hover)'
            : 'var(--color-background-default)',
        }}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Icon
          name={IconName.Upload}
          size={IconSize.Md}
          color={active ? IconColor.infoDefault : IconColor.iconAlternative}
        />
        <Text
          color={active ? IconColor.infoDefault : IconColor.iconAlternative}
        >
          {t('uploadDropFile')}
        </Text>
      </Box>
      {footer}
    </Box>
  );
};
