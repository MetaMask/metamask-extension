import React from 'react';
import type { KeyType, SigningProtocol } from '../types';

type ToggleButtonGroupProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  disabledOptions?: T[];
};

export function ToggleButtonGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
  disabledOptions = [],
}: ToggleButtonGroupProps<T>): React.ReactElement {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#a0a0a0',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          gap: '8px',
        }}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const isDisabled =
            disabled || disabledOptions.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !isDisabled && onChange(option.value)}
              disabled={isDisabled}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: isSelected
                  ? '2px solid #6366f1'
                  : '2px solid transparent',
                background: isSelected
                  ? 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)'
                  : isDisabled
                    ? '#2a2a3e'
                    : '#3a3a4e',
                color: isDisabled ? '#666' : isSelected ? '#fff' : '#ccc',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type KeyTypeSelectorProps = {
  value: KeyType;
  onChange: (value: KeyType) => void;
  disabled?: boolean;
};

export const KeyTypeSelector: React.FC<KeyTypeSelectorProps> = ({
  value,
  onChange,
  disabled,
}) => (
  <ToggleButtonGroup<KeyType>
    label="Key Type (for Create Key)"
    value={value}
    onChange={onChange}
    disabled={disabled}
    options={[
      { value: 'secp256k1', label: 'secp256k1' },
      { value: 'edwards25519', label: 'edwards25519' },
    ]}
  />
);

type SigningProtocolSelectorProps = {
  value: SigningProtocol;
  onChange: (value: SigningProtocol) => void;
  keyType: KeyType;
  disabled?: boolean;
};

export const SigningProtocolSelector: React.FC<SigningProtocolSelectorProps> = ({
  value,
  onChange,
  keyType,
  disabled,
}) => {
  // DKLS for secp256k1, FROST for edwards25519
  const disabledOptions: SigningProtocol[] =
    keyType === 'secp256k1' ? ['frost'] : ['dkls'];

  return (
    <ToggleButtonGroup<SigningProtocol>
      label={`Signing Protocol ${keyType === 'secp256k1' ? '(ECDSA)' : '(Schnorr)'}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      disabledOptions={disabledOptions}
      options={[
        { value: 'dkls', label: 'DKLS' },
        { value: 'frost', label: 'FROST' },
      ]}
    />
  );
};

export default { ToggleButtonGroup, KeyTypeSelector, SigningProtocolSelector };

