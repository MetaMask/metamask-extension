/* eslint-disable @metamask/design-tokens/color-no-hex */
import React from 'react';
import type { StoredKeyShare } from '../types';

type KeyShareCardProps = {
  keyShare: StoredKeyShare | null;
  onDelete: () => void;
  disabled?: boolean;
};

export const KeyShareCard: React.FC<KeyShareCardProps> = ({
  keyShare,
  onDelete,
  disabled = false,
}) => {
  if (!keyShare) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1e2f 0%, #2a2a3e 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #3a3a4e',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#6b7280',
            }}
          />
          <span
            style={{
              color: '#6b7280',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            No Key Share
          </span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Create a key to get started with MPC signing
        </p>
      </div>
    );
  }

  const publicKeyHex = keyShare.publicKey
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const truncatedPk = `${publicKeyHex.substring(0, 16)}...`;
  const createdDate = new Date(keyShare.createdAt).toLocaleDateString();
  const partyCount = keyShare.hasThreeParties ? '2-of-3' : '2-of-2';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e1e2f 0%, #2a2a3e 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #3a3a4e',
      }}
    >
      {/* Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <span
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 8px #22c55e',
          }}
        />
        <span
          style={{
            color: '#22c55e',
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          Key Share Active
        </span>
      </div>

      {/* Key Info */}
      <div style={{ marginBottom: '20px' }}>
        <InfoRow label="Curve" value={keyShare.keyType} />
        <InfoRow label="Public Key" value={truncatedPk} mono />
        <InfoRow label="Threshold" value={partyCount} />
        <InfoRow label="Created" value={createdDate} />
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          border: 'none',
          background: disabled ? '#3a3a4e' : 'rgba(220, 38, 38, 0.2)',
          color: disabled ? '#666' : '#dc2626',
          fontSize: '16px',
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        Delete Key
      </button>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono = false,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #3a3a4e',
    }}
  >
    <span style={{ color: '#9ca3af', fontSize: '14px' }}>{label}</span>
    <span
      style={{
        color: '#e5e7eb',
        fontSize: '14px',
        fontFamily: mono ? 'monospace' : 'inherit',
      }}
    >
      {value}
    </span>
  </div>
);

export default KeyShareCard;
