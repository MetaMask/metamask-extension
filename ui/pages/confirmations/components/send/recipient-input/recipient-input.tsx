import React, { useCallback, useMemo } from 'react';
import { AvatarAccountSize } from '@metamask/design-system-react';

import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextField,
  TextFieldSize,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import {
  isValidDomainName,
  shortenAddress,
} from '../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useRecipientValidation } from '../../../hooks/send/useRecipientValidation';
import { useRecipients } from '../../../hooks/send/useRecipients';
import { useAccountAddressSeedIconMap } from '../../../hooks/send/useAccountAddressSeedIconMap';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useSendContext } from '../../../context/send';
import { ConfusableRecipientName } from './confusable-recipient-name';

export const RecipientInput = ({
  openRecipientModal,
  recipientInputRef,
  recipientValidationResult,
}: {
  openRecipientModal: () => void;
  recipientInputRef: React.RefObject<HTMLInputElement>;
  recipientValidationResult: ReturnType<typeof useRecipientValidation>;
}) => {
  const { setRecipientInputMethodManual, setRecipientInputMethodPasted } =
    useRecipientSelectionMetrics();
  const recipients = useRecipients();
  const t = useI18nContext();
  const { to, updateTo } = useSendContext();
  const { accountAddressSeedIconMap } = useAccountAddressSeedIconMap();
  const {
    recipientConfusableCharacters,
    recipientError,
    recipientResolvedLookup,
    toAddressValidated,
  } = recipientValidationResult;
  const avatarSeedAddress =
    accountAddressSeedIconMap.get(to?.toLowerCase() as string) ||
    recipientResolvedLookup ||
    to ||
    '';

  const onToChange = useCallback(
    (e) => {
      if (e.nativeEvent.inputType === 'insertFromPaste') {
        setRecipientInputMethodPasted();
      } else {
        setRecipientInputMethodManual();
      }

      const address = e.target.value;
      updateTo(address);
    },
    [updateTo, setRecipientInputMethodManual, setRecipientInputMethodPasted],
  );

  const clearRecipient = useCallback(() => {
    updateTo('');
  }, [updateTo]);

  const resolvedAddress = useMemo(() => {
    const addressIsValid =
      to?.length && to === toAddressValidated && recipientError === undefined;

    return addressIsValid
      ? shortenAddress(recipientResolvedLookup ?? to)
      : undefined;
  }, [recipientError, recipientResolvedLookup, toAddressValidated, to]);

  const recipientName = useMemo(() => {
    const matchingRecipient = recipients.find(
      (recipient) => recipient.address.toLowerCase() === to?.toLowerCase(),
    );

    return to && isValidDomainName(to)
      ? to
      : matchingRecipient?.contactName || matchingRecipient?.accountGroupName;
  }, [recipients, to]);

  return (
    <>
      {resolvedAddress ? (
        <Box
          alignItems={AlignItems.center}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          borderColor={BorderColor.borderDefault}
          borderWidth={1}
          borderRadius={BorderRadius.MD}
          padding={3}
        >
          <Box alignItems={AlignItems.center} display={Display.Flex}>
            <PreferredAvatar
              address={avatarSeedAddress}
              size={AvatarAccountSize.Md}
            />
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              marginLeft={3}
            >
              {recipientConfusableCharacters?.length ? (
                <ConfusableRecipientName
                  confusableCharacters={recipientConfusableCharacters}
                />
              ) : (
                <Text variant={TextVariant.bodyMd}>
                  {recipientName ?? resolvedAddress}
                </Text>
              )}
              {recipientName && (
                <Text
                  color={TextColor.textAlternative}
                  variant={TextVariant.bodySm}
                >
                  {resolvedAddress}
                </Text>
              )}
            </Box>
          </Box>
          <ButtonIcon
            ariaLabel="Clear recipient"
            data-testid="clear-recipient-btn"
            iconName={IconName.Close}
            onClick={clearRecipient}
            size={ButtonIconSize.Sm}
          />
        </Box>
      ) : (
        <TextField
          error={Boolean(recipientError)}
          endAccessory={
            recipients.length > 0 ? (
              <ButtonIcon
                ariaLabel="Open recipient modal"
                data-testid="open-recipient-modal-btn"
                iconName={IconName.Book}
                onClick={openRecipientModal}
                size={ButtonIconSize.Md}
              />
            ) : null
          }
          onChange={onToChange}
          placeholder={t('recipientPlaceholder')}
          ref={recipientInputRef}
          value={to}
          width={BlockSize.Full}
          size={TextFieldSize.Lg}
          paddingRight={3}
        />
      )}
    </>
  );
};
