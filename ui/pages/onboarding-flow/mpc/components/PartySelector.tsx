/* eslint-disable @metamask/design-tokens/color-no-hex */
import React from 'react';
import type { SigningParties, PartyId } from '../types';
import { PARTY_LABELS } from '../constants';

type PartySelectorProps = {
  parties: SigningParties;
  onChange: (parties: SigningParties) => void;
  hasThreeParties: boolean;
  disabled?: boolean;
};

type PartyOption = {
  id: PartyId;
  key: keyof SigningParties;
  available: boolean;
};

export const PartySelector: React.FC<PartySelectorProps> = ({
  parties,
  onChange,
  hasThreeParties,
  disabled = false,
}) => {
  // Extension (Party 2) is always selected
  // User chooses between Server (1) or Mobile (3) as the other party
  const partyOptions: PartyOption[] = [
    { id: '1', key: 'party1', available: true },
    { id: '2', key: 'party2', available: true },
    { id: '3', key: 'party3', available: hasThreeParties },
  ];

  const handleToggle = (key: keyof SigningParties) => {
    // Party 2 (extension) cannot be deselected
    if (key === 'party2') {
      return;
    }

    const newValue = !parties[key];

    // Toggle between party1 and party3 (only one can be selected with party2)
    if (key === 'party1') {
      onChange({
        party1: newValue,
        party2: true,
        party3: !newValue && hasThreeParties ? parties.party3 : false,
      });
    } else if (key === 'party3') {
      onChange({
        party1: !newValue ? parties.party1 : false,
        party2: true,
        party3: newValue,
      });
    }
  };

  const otherParty = parties.party1
    ? 'Server'
    : parties.party3
      ? 'Mobile'
      : 'None';

  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#a0a0a0',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Sign with Extension +
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {partyOptions
          .filter(({ key }) => key !== 'party2')
          .map(({ id, key, available }) => {
            const isSelected = parties[key];
            const isDisabled = disabled || !available;

            return (
              <button
                key={id}
                type="button"
                onClick={() => !isDisabled && handleToggle(key)}
                disabled={isDisabled}
                style={{
                  padding: '12px 20px',
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
                {PARTY_LABELS[id]}
              </button>
            );
          })}
      </div>
      <div
        style={{
          marginTop: '10px',
          fontSize: '12px',
          color: '#888',
        }}
      >
        Signing: Extension + {otherParty}
      </div>
    </div>
  );
};

export default PartySelector;
