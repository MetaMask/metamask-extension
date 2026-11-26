import React, { useRef, useState, type ReactNode } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextField,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import StepLayout, {
  StepMessage,
  INPUT_A11Y_PROPS,
} from '../steps/step-layout';
import {
  DEFAULT_PHONE_NUMBER_ENTRY_TEST_ID_PREFIX,
  getPhoneNumberEntryTestIds,
} from './phone-number-entry.test-ids';
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  PHONE_COUNTRIES,
  formatNational,
  getCountryFlag,
  getDialPrefix,
  getInitialPhone,
  getPhoneCountry,
  isValidNational,
  parsePhoneInput,
  toPhoneNumberValue,
  type PhoneNumberValue,
} from './phone';

export type PhoneNumberEntryProps = {
  /** The screen's title. */
  title: string;
  /** The line under the title. */
  description?: string;
  /** The label of the button that submits the number. */
  ctaLabel: string;
  /**
   * A small note above the button, e.g. what the number is used for or who
   * sends the code. A string renders as centred secondary text.
   */
  disclaimer?: ReactNode;
  /** ISO 3166-1 code of the country to start with. Defaults to `US`. */
  defaultCountry?: string;
  /** A number to start with: E.164, or national digits of `defaultCountry`. */
  initialValue?: string;
  /**
   * Called with a valid number when the user submits. The caller sends the
   * code and reports a failure through `error`; a rejection is ignored here.
   */
  onSubmit: (phone: PhoneNumberValue) => Promise<void>;
  /** Shows the submit button as loading and ignores further submits. */
  isSubmitting?: boolean;
  /** A message under the input, from the caller. A string renders as an error. */
  error?: ReactNode;
  /** Prefix of the test ids; see `getPhoneNumberEntryTestIds`. */
  testIdPrefix?: string;
};

// Digits for the example number shown as the placeholder: (555) 123-4567.
const EXAMPLE_DIGITS = '5551234567890';

// The default country first, then A to Z.
const COUNTRY_OPTIONS = [...PHONE_COUNTRIES]
  .sort(
    (first, second) =>
      Number(second.iso === DEFAULT_PHONE_COUNTRY_ISO) -
        Number(first.iso === DEFAULT_PHONE_COUNTRY_ISO) ||
      first.name.localeCompare(second.name),
  )
  .map((country) => ({
    country,
    label: `${getCountryFlag(country.iso)} ${country.name} ${getDialPrefix(country)}`,
  }));

/**
 * The "Verify your phone number" screen: a phone input with a country code
 * picker, formatting as the user types, validation and E.164 output. It knows
 * nothing of the MFA engine; everything flow specific comes in through props.
 */
const PhoneNumberEntry = ({
  title,
  description,
  ctaLabel,
  disclaimer,
  defaultCountry,
  initialValue,
  onSubmit,
  isSubmitting = false,
  error,
  testIdPrefix = DEFAULT_PHONE_NUMBER_ENTRY_TEST_ID_PREFIX,
}: PhoneNumberEntryProps) => {
  const t = useI18nContext();
  const ids = getPhoneNumberEntryTestIds(testIdPrefix);
  const [phone, setPhone] = useState(() =>
    getInitialPhone(initialValue, defaultCountry),
  );
  const [isTouched, setIsTouched] = useState(false);
  const isSending = useRef(false);

  const { country, digits } = phone;
  const isValid = isValidNational(digits, country);
  const showInvalid = isTouched && digits.length > 0 && !isValid;

  const submit = async () => {
    if (!isValid) {
      setIsTouched(true);
      return;
    }
    if (isSubmitting || isSending.current) {
      return;
    }
    isSending.current = true;
    try {
      await onSubmit(toPhoneNumberValue(digits, country));
    } catch {
      // The caller reports a failure through `error`.
    } finally {
      isSending.current = false;
    }
  };

  const renderError = () => {
    if (showInvalid) {
      return (
        <div data-testid={ids.INVALID}>
          <StepMessage isError>{t('mfaPhoneEntryInvalid')}</StepMessage>
        </div>
      );
    }
    if (typeof error === 'string') {
      return (
        <div data-testid={ids.ERROR}>
          <StepMessage isError>{error}</StepMessage>
        </div>
      );
    }
    return error ?? null;
  };

  return (
    <StepLayout
      title={title}
      description={description}
      footer={
        <>
          {disclaimer ? (
            <div data-testid={ids.DISCLAIMER}>
              {typeof disclaimer === 'string' ? (
                <Text
                  variant={TextVariant.BodyXs}
                  color={TextColor.TextAlternative}
                  className="text-center pb-2"
                >
                  {disclaimer}
                </Text>
              ) : (
                disclaimer
              )}
            </div>
          ) : null}
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
            isLoading={isSubmitting}
            isDisabled={!isValid}
            onClick={() => {
              submit().catch(() => undefined);
            }}
            data-testid={ids.SUBMIT_BUTTON}
          >
            {ctaLabel}
          </Button>
        </>
      }
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={2} paddingTop={4}>
        <TextField
          value={formatNational(digits, country)}
          startAccessory={
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={2}
              className="relative"
            >
              <Text variant={TextVariant.BodyMd}>
                {getCountryFlag(country.iso)} +{country.callingCode}
              </Text>
              <Icon
                name={IconName.ArrowDown}
                size={IconSize.Xs}
                color={IconColor.IconAlternative}
              />
              <Box className="h-3.5 w-px bg-border-muted" />
              <select
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label={t('mfaPhoneEntryCountryLabel')}
                value={country.iso}
                onChange={(event) => {
                  const next = getPhoneCountry(event.target.value);
                  setPhone({
                    country: next,
                    digits: parsePhoneInput(digits, next).digits,
                  });
                  setIsTouched(false);
                }}
                data-testid={ids.COUNTRY_SELECT}
              >
                {COUNTRY_OPTIONS.map(({ country: option, label }) => (
                  <option key={option.iso} value={option.iso}>
                    {label}
                  </option>
                ))}
              </select>
            </Box>
          }
          onChange={(event) => {
            // Typing and pasting both land here; a pasted `+44…` number
            // also switches the country.
            setPhone(parsePhoneInput(event.target.value, country));
            setIsTouched(false);
          }}
          onBlur={() => setIsTouched(true)}
          placeholder={formatNational(
            EXAMPLE_DIGITS.slice(0, country.minDigits),
            country,
          )}
          isError={showInvalid || error !== undefined}
          autoFocus
          inputProps={{
            ...INPUT_A11Y_PROPS,
            inputMode: 'tel',
            autoComplete: 'tel-national',
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                submit().catch(() => undefined);
              }
            },
          }}
          data-testid={ids.INPUT}
        />
        {renderError()}
      </Box>
    </StepLayout>
  );
};

export default PhoneNumberEntry;
