// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import UnitInput from '../../../ui/unit-input';
import { Numeric } from '../../../../../shared/modules/Numeric';

type NFTInputProps = {
  integerValue: number;
  onChange?: (newAmountRaw: string, newAmountFormatted: string) => void;
  className?: string;
};

const NUMBERS_REGEX = /^[0-9]*$/u;

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function NFTInput({ integerValue, onChange, className }: NFTInputProps) {
  const handleChange = (newValueAsString: number) => {
    if (!onChange) {
      return;
    }

    const newValue = new Numeric(newValueAsString, 10);

    if (!Number.isInteger(newValue.toNumber())) {
      return;
    }

    onChange(newValue.toPrefixedHexString(), String(newValueAsString));
  };

  return (
    <UnitInput
      isDisabled={!onChange}
      isFocusOnInput={Boolean(onChange)}
      type="number"
      step={1}
      min={0}
      dataTestId="nft-input"
      onChange={handleChange}
      value={integerValue}
      className={className}
      keyPressRegex={NUMBERS_REGEX}
    />
  );
}
