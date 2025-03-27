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
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import {
  Box,
  FormTextField,
  FormTextFieldProps,
  FormTextFieldSize,
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

export type SnapUIAddressInputProps = {
  name: string;
  form?: string;
  label?: string;
  chainId: CaipChainId;
  displayAvatar?: boolean;
};

export const SnapUIAddressInput: FunctionComponent<
  SnapUIAddressInputProps & FormTextFieldProps<'div'>
> = ({ name, form, label, chainId, displayAvatar = true, error, ...props }) => {
  const { handleInputChange, getValue, focusedInput, setCurrentFocusedInput } =
    useSnapInterfaceContext();

  const inputRef = useRef<HTMLDivElement>(null);
  const initialValue = getValue(name, form) as string;
  const { namespace, reference } = parseCaipChainId(chainId);

  const [value, setValue] = useState(
    initialValue
      ? parseCaipAccountId(initialValue as CaipAccountId).address
      : '',
  );

  const displayName = useDisplayName({
    address: value,
    chain: {
      namespace,
      reference,
    },
    chainId,
  });

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
    setValue('');
    handleInputChange(name, '', form);
  };

  const MatchedAccountInfo = () => {
    return (
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        {label && (
          <Label className={classnames('mm-form-text-field__label')}>
            {label}
          </Label>
        )}
        <Box
          display={Display.Flex}
          backgroundColor={BackgroundColor.backgroundDefault}
          alignItems={AlignItems.center}
          borderWidth={1}
          borderRadius={BorderRadius.LG}
          borderColor={BorderColor.borderMuted}
          paddingLeft={4}
          paddingRight={4}
          gap={2}
          style={{
            height: '48px',
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
            onClick={handleClear}
            name={IconName.Close}
            color={IconColor.infoDefault}
            style={{
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
        </Box>
      </Box>
    );
  };

  if (displayName) {
    return <MatchedAccountInfo />;
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
      error={Boolean(error)}
      size={FormTextFieldSize.Lg}
      helpText={error}
      textFieldProps={{
        borderRadius: BorderRadius.LG,
      }}
      startAccessory={
        displayAvatar && value ? (
          <SnapUIAvatar address={`${chainId}:${value}`} size="sm" />
        ) : null
      }
      endAccessory={
        value ? (
          <Icon
            onClick={handleClear}
            name={IconName.Close}
            color={IconColor.infoDefault}
            style={{ cursor: 'pointer' }}
          />
        ) : null
      }
      {...props}
    />
  );
};
