import React from 'react';

type DisableConfirmationProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

function WarningIcon() {
  return (
    <svg
      className="disable-modal-warning"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="#f5c518" strokeWidth="2" />
      <rect x="11" y="6.5" width="2" height="7.5" rx="1" fill="#f5c518" />
      <rect x="11" y="15.5" width="2" height="2" rx="1" fill="#f5c518" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DisableConfirmation({
  onCancel,
  onConfirm,
}: DisableConfirmationProps) {
  const stop = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className="disable-overlay"
      onClick={(event) => {
        stop(event);
        onCancel();
      }}
    >
      <div
        className="disable-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Disable MetaMask widget?"
        onClick={stop}
      >
        <div className="disable-modal-header">
          <span className="disable-modal-header-spacer" />
          <div className="disable-modal-title-wrap">
            <WarningIcon />
            <p className="disable-modal-title">Disable MetaMask widget?</p>
          </div>
          <button
            className="disable-modal-close"
            type="button"
            aria-label="Close"
            onClick={(event) => {
              stop(event);
              onCancel();
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <p className="disable-modal-body">
          {`You won't see the MetaMask widget on X anymore. Turn it back on anytime in `}
          <strong>Settings &gt; Preferences</strong>.
        </p>

        <div className="disable-modal-footer">
          <button
            className="disable-modal-cancel"
            type="button"
            onClick={(event) => {
              stop(event);
              onCancel();
            }}
          >
            Cancel
          </button>
          <button
            className="disable-modal-confirm"
            type="button"
            onClick={(event) => {
              stop(event);
              onConfirm();
            }}
          >
            Disable
          </button>
        </div>
      </div>
    </div>
  );
}
