import React from 'react';
import type { MpcConfig } from '../types';

type ConfigInputsProps = {
  config: MpcConfig;
  onChange: (config: MpcConfig) => void;
  disabled?: boolean;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid #444',
  background: '#1a1a2e',
  color: '#e0e0e0',
  fontSize: '13px',
  fontFamily: 'JetBrains Mono, Fira Code, Monaco, monospace',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#888',
  marginBottom: '6px',
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
};

export const ConfigInputs: React.FC<ConfigInputsProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  const handleChange =
    (field: keyof MpcConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...config, [field]: e.target.value });
    };

  return (
    <div
      style={{
        display: 'grid',
        gap: '12px',
        marginBottom: '20px',
      }}
    >
      <div>
        <label style={labelStyle}>Centrifugo URL</label>
        <input
          type="text"
          value={config.centrifugeUrl}
          onChange={handleChange('centrifugeUrl')}
          disabled={disabled}
          style={{
            ...inputStyle,
            opacity: disabled ? 0.6 : 1,
          }}
        />
      </div>
      <div>
        <label style={labelStyle}>MPC Server URL</label>
        <input
          type="text"
          value={config.serverUrl}
          onChange={handleChange('serverUrl')}
          disabled={disabled}
          style={{
            ...inputStyle,
            opacity: disabled ? 0.6 : 1,
          }}
        />
      </div>
      <div>
        <label style={labelStyle}>TSS Verifier ID</label>
        <input
          type="text"
          value={config.tssVerifierId}
          onChange={handleChange('tssVerifierId')}
          disabled={disabled}
          style={{
            ...inputStyle,
            opacity: disabled ? 0.6 : 1,
          }}
        />
      </div>
    </div>
  );
};

export default ConfigInputs;

