import React from 'react';

export const SRPTextArea = ({ setSecretRecoveryPhrase }) => {
  return (
    <div className="srp-text-area">
      <button>
        <i className="far fa-eye-slash" color="grey" />
      </button>
      <textarea
        className="srp-text-area__textarea"
        onChange={({ target: { value } }) => setSecretRecoveryPhrase(value)}
      />
    </div>
  );
};
