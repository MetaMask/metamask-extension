import React, {
  ChangeEvent,
  FunctionComponent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { debounce } from 'lodash';
import {
  CaipAccountId,
  CaipChainId,
  parseCaipAccountId,
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
import { getAccountInfoByCaipChainId } from '../../../../selectors/selectors';
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
import Jazzicon from '../../../ui/jazzicon';

export type SnapUIAddressInputProps = {
  name: string;
  form?: string;
  label?: string;
  chainId: CaipChainId;
};

export const SnapUIAddressInput: FunctionComponent<
  SnapUIAddressInputProps & FormTextFieldProps<'div'>
> = ({ name, form, label, chainId, error, ...props }) => {
  const { handleInputChange, getValue, focusedInput, setCurrentFocusedInput } =
    useSnapInterfaceContext();

  const inputRef = useRef<HTMLDivElement>(null);

  const initialValue = getValue(name, form) as string;

  const [value, setValue] = useState(
    initialValue
      ? parseCaipAccountId(initialValue as CaipAccountId).address
      : '',
  );
  const [matchedAddressName, setMatchedAddressName] = useState<string | null>(
    null,
  );

  const accountsInfo: Record<string, string> = useSelector((state) =>
    getAccountInfoByCaipChainId(state, chainId),
  );

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== null) {
      const { address } = parseCaipAccountId(initialValue as CaipAccountId);
      setValue(address);
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

  const getMatchedAddressName = (address: string) => {
    const normalizedAddress = address.toLowerCase();
    return accountsInfo[normalizedAddress];
  };

  const debouncedHandleInputChange = debounce(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleInputChange(name, event.target.value ?? null, form);
    },
    80,
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    const matchedName = getMatchedAddressName(event.target.value);
    if (matchedName) {
      setMatchedAddressName(matchedName);
    }
    // Debouncing to allow for rapid keystrokes before allowing the snap to react to the changes
    debouncedHandleInputChange(event);
  };

  const handleFocus = () => setCurrentFocusedInput(name);
  const handleBlur = () => setCurrentFocusedInput(null);

  const handleClear = () => {
    setValue('');
    setMatchedAddressName(null);
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
          display={Display.InlineFlex}
          backgroundColor={BackgroundColor.backgroundDefault}
          alignItems={AlignItems.center}
          borderWidth={1}
          borderRadius={BorderRadius.SM}
          borderColor={BorderColor.borderMuted}
          paddingLeft={4}
          paddingRight={4}
          gap={2}
          style={{ height: '48px' }}
        >
          <Jazzicon address={value} diameter={24} />
          <Box flexDirection={FlexDirection.Column} gap={2}>
            <Text fontWeight={FontWeight.Bold}>{matchedAddressName}</Text>
            <Text variant={TextVariant.bodyXs} ellipsis>
              {value}
            </Text>
          </Box>
          <Icon
            onClick={handleClear}
            name={IconName.Close}
            color={IconColor.infoDefault}
            style={{ cursor: 'pointer' }}
          />
        </Box>
      </Box>
    );
  };

  return matchedAddressName ? (
    <MatchedAccountInfo />
  ) : (
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
