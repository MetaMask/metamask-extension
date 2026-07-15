import React, { useCallback, useEffect } from 'react';
import classnames from 'clsx';
import { isHexString } from '@metamask/utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { addHexPrefix } from '../../../../../../shared/lib/add-hex-prefix';
import { shortenAddress } from '../../../../../helpers/utils/util';
import {
  isBurnAddress,
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../../../../shared/lib/hexstring-utils';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../../components/component-library';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import {
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';

type DomainInputProps = {
  className?: string;
  selectedAddress?: string;
  selectedName?: string;
  scanQrCode?: () => void;
  onPaste?: (address: string) => void;
  onValidAddressTyped?: (address: string) => void;
  internalSearch?: boolean;
  userInput?: string;
  onChange: (value: string) => void;
  onReset: () => void;
  lookupDomainName: (domainName: string) => void;
  initializeDomainSlice: () => void;
  resetDomainResolution: () => void;
};

export default function DomainInput({
  className,
  selectedAddress,
  selectedName,
  scanQrCode,
  onPaste,
  onValidAddressTyped,
  internalSearch,
  userInput,
  onChange,
  onReset,
  lookupDomainName,
  initializeDomainSlice,
  resetDomainResolution,
}: DomainInputProps) {
  const t = useI18nContext();

  useEffect(() => {
    initializeDomainSlice();
  }, [initializeDomainSlice]);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      if (event.clipboardData.items?.length) {
        const clipboardItem = event.clipboardData.items[0];
        clipboardItem?.getAsString((text) => {
          const input = text.trim();
          if (
            onPaste &&
            !isBurnAddress(input) &&
            isValidHexAddress(input, { mixedCaseUseChecksum: true })
          ) {
            onPaste(addHexPrefix(input));
          }
        });
      }
    },
    [onPaste],
  );

  const handleChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
      const input = value.trim();

      if (internalSearch) {
        onChange(input);
        return;
      }

      if (isHexString(input)) {
        resetDomainResolution();
        if (
          onValidAddressTyped &&
          !isBurnAddress(input) &&
          isValidHexAddress(input, { mixedCaseUseChecksum: true })
        ) {
          const hexInput = addHexPrefix(input);
          onChange(hexInput);
          onValidAddressTyped(hexInput);
        } else {
          onChange(input);
        }
      } else {
        onChange(input);
        lookupDomainName(input);
      }
    },
    [
      internalSearch,
      lookupDomainName,
      onChange,
      onValidAddressTyped,
      resetDomainResolution,
    ],
  );

  const hasSelectedAddress = Boolean(selectedAddress);

  const shortenedAddress =
    selectedName && selectedAddress
      ? shortenAddress(toChecksumHexAddress(selectedAddress))
      : undefined;

  return (
    <div className={classnames('ens-input', className)}>
      <div
        className={classnames('ens-input__wrapper', {
          'ens-input__wrapper__status-icon--error': false,
          'ens-input__wrapper__status-icon--valid': false,
          'ens-input__wrapper--valid': hasSelectedAddress,
        })}
      >
        {hasSelectedAddress ? (
          <>
            <div
              className="ens-input__wrapper__input ens-input__wrapper__input--selected"
              data-testid="ens-input-selected"
            >
              <PreferredAvatar address={selectedAddress as string} />

              <div className="ens-input__selected-input__title">
                {selectedName || selectedAddress}
                {shortenedAddress ? (
                  <Text
                    color={TextColor.textAlternative}
                    variant={TextVariant.bodySm}
                    ellipsis
                  >
                    {shortenedAddress}
                  </Text>
                ) : null}
              </div>
            </div>
            <ButtonIcon
              iconName={IconName.Close}
              ariaLabel={t('close')}
              onClick={onReset}
              className="ens-input__wrapper__action-icon-button"
              size={ButtonIconSize.Sm}
            />
          </>
        ) : (
          <>
            <input
              className="ens-input__wrapper__input"
              type="text"
              dir="auto"
              placeholder={t('recipientAddressPlaceholderNew')}
              onChange={handleChange}
              onPaste={handlePaste}
              spellCheck="false"
              value={selectedAddress || userInput}
              autoFocus
              data-testid="ens-input"
            />
            <ButtonIcon
              className="ens-input__wrapper__action-icon-button"
              onClick={() => {
                if (userInput?.length) {
                  onReset();
                } else {
                  scanQrCode?.();
                }
              }}
              iconName={userInput ? IconName.Close : IconName.Scan}
              ariaLabel={t(userInput ? 'close' : 'scanQrCode')}
              color={
                userInput ? IconColor.iconDefault : IconColor.primaryDefault
              }
              data-testid="ens-qr-scan-button"
            />
          </>
        )}
      </div>
    </div>
  );
}
