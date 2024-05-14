import React from 'react';
import UnitInput from '../../../ui/unit-input';
import { Numeric } from '../../../../../shared/modules/Numeric';

type NFTInputProps = {
  integerValue: number;
  onChange: (newHexValue: string) => void;
  className?: string;
};

const NUMBERS_REGEX = /^[0-9]*$/u;

export function NFTInput({ integerValue, onChange, className }: NFTInputProps) {
  const handleChange = (newValueAsString: number) => {
    const newValue = new Numeric(newValueAsString, 10);

    if (!Number.isInteger(newValue.toNumber())) {
      return;
    }

    onChange(newValue.toPrefixedHexString());
  };

  return (
    <UnitInput
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
