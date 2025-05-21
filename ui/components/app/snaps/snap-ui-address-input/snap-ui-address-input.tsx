import React, {
  ChangeEvent,
  FunctionComponent,
  useEffect,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';
import {
  CaipAccountId,
  CaipChainId,
  isCaipAccountId,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import {
  Box,
  FormTextField,
  FormTextFieldProps,
  FormTextFieldSize,
  HelpText,
  HelpTextSeverity,
  Icon,
  IconName,
  Label,
  Text,
} from '../../../component-library';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { SnapUIAvatar } from '../snap-ui-avatar';
import { useDisplayName } from '../../../../hooks/snaps/useDisplayName';

type MatchedAccountInfoProps = {
  value: string;
  chainId: CaipChainId;
  displayName: string;
  label?: string;
  displayAvatar?: boolean;
  handleClear: () => void;
  disabled?: boolean;
  error?: string;
};

const MatchedAccountInfo: FunctionComponent<MatchedAccountInfoProps> = ({
  label,
  displayAvatar,
  chainId,
  value,
  displayName,
  handleClear,
  disabled,
  error,
}) => (
  <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
    {label && (
      <Label className={classnames('mm-form-text-field__label')}>{label}</Label>
    )}
    <Box
      display={Display.Flex}
      backgroundColor={BackgroundColor.backgroundDefault}
      className="snap-ui-renderer__matched-account-info"
      alignItems={AlignItems.center}
      borderWidth={1}
      borderRadius={BorderRadius.LG}
      borderColor={BorderColor.borderMuted}
      paddingLeft={4}
      paddingRight={4}
      gap={2}
      style={{
        height: '48px',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'auto',
      }}
    >
      {displayAvatar && (
        <SnapUIAvatar address={`${chainId}:${value}`} size="sm" />
      )}
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        gap={2}
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <Box
          flexDirection={FlexDirection.Column}
          gap={2}
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <Text fontWeight={FontWeight.Medium}>{displayName}</Text>
          <Text variant={TextVariant.bodyXs} ellipsis>
            {value}
          </Text>
        </Box>
      </Box>
      <Icon
        className="snap-ui-renderer__matched-account-info__clear-button"
        onClick={handleClear}
        name={IconName.Close}
        color={IconColor.infoDefault}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          flexShrink: 0,
        }}
      />
    </Box>
    {error && (
      <HelpText severity={HelpTextSeverity.Danger} marginTop={1}>
        {error}
      </HelpText>
    )}
  </Box>
);

export type SnapUIAddressInputProps = {
  name: string;
  form?: string;
  label?: string;
  chainId: CaipChainId;
  displayAvatar?: boolean;
  error?: string;
  disabled?: boolean;
};

export const SnapUIAddressInput: FunctionComponent<
  SnapUIAddressInputProps & FormTextFieldProps<'div'>
> = ({
  name,
  form,
  label,
  chainId,
  displayAvatar = true,
  error,
  disabled,
  ...props
}) => {
  const { handleInputChange, getValue, focusedInput, setCurrentFocusedInput } =
    useSnapInterfaceContext();

  const inputRef = useRef<HTMLDivElement>(null);
  const initialValue = getValue(name, form) as string;
  const { namespace, reference } = parseCaipChainId(chainId);

  /**
   * Parses the value to get the address.
   * If the value is a CAIP-10 account ID, it extracts the address otherwise returns the raw value.
   *
   * @param value - The value to parse.
   * @returns The address or the raw value.
   */
  const getParsedValue = (value?: string) => {
    if (!value) {
      return '';
    }

    /*
     * Safeguard against invalid CAIP-10 account ID.
     * We can't ensure that when we append the value to the chain ID
     * it will be a valid CAIP-10 account ID.
     */
    if (isCaipAccountId(value)) {
      const { address } = parseCaipAccountId(value as CaipAccountId);
      return address;
    }

    return value;
  };

  const [value, setValue] = useState(getParsedValue(initialValue));

  const displayName = useDisplayName({
    address: value,
    chain: {
      namespace,
      reference,
    },
    chainId,
  });

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== null) {
      setValue(getParsedValue(initialValue));
    }
  }, [initialValue]);

  /*
   * Focus input if the last focused input was this input
   * This avoids losing the focus when the UI is re-rendered
   */
  useEffect(() => {
    if (inputRef.current && name === focusedInput) {
      (inputRef.current.querySelector('input') as HTMLInputElement).focus();
    }
  }, [inputRef]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);

    const newValue = event.target.value
      ? `${chainId}:${event.target.value}`
      : '';

    handleInputChange(name, newValue, form);
  };

  const handleFocus = () => setCurrentFocusedInput(name);
  const handleBlur = () => setCurrentFocusedInput(null);

  const handleClear = () => {
    if (!disabled) {
      setValue('');
      handleInputChange(name, '', form);
    }
  };

  if (displayName) {
    return (
      <MatchedAccountInfo
        chainId={chainId}
        label={label}
        value={value}
        displayAvatar={displayAvatar}
        displayName={displayName}
        handleClear={handleClear}
        disabled={disabled}
        error={error}
      />
    );
  }

  return (
    <FormTextField
      ref={inputRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={classnames('snap-ui-renderer__address-input', {
        'snap-ui-renderer__field': label !== undefined,
      })}
      id={name}
      value={value}
      onChange={handleChange}
      label={label}
      disabled={disabled}
      error={Boolean(error)}
      size={FormTextFieldSize.Lg}
      helpText={error}
      textFieldProps={{
        borderRadius: BorderRadius.LG,
      }}
      startAccessory={
        displayAvatar && value && isCaipAccountId(`${chainId}:${value}`) ? (
          <SnapUIAvatar address={`${chainId}:${value}`} size="sm" />
        ) : null
      }
      endAccessory={
        value ? (
          <Icon
            className="snap-ui-renderer__address-input__clear-button"
            onClick={handleClear}
            name={IconName.Close}
            color={IconColor.infoDefault}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
          />
        ) : null
      }
      {...props}
    />
  );
};
