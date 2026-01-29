/**
 * Seed Phrase Protection UI Module
 *
 * This module provides the UI components for the seed phrase protection feature.
 * It uses Shadow DOM to isolate styles from the host page, preventing CSS conflicts.
 *
 * Note: This CSS is injected into external web pages where MetaMask design tokens
 * are not available, so we must use raw hex values here.
 */
/* eslint-disable @metamask/design-tokens/color-no-hex */

/**
 * MetaMask Fox SVG logo (inline for content script usage)
 */
const METAMASK_FOX_SVG = `<svg viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="#E17726" stroke="#E17726" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2.66296 1L15.68 10.809L13.3546 4.99098L2.66296 1Z" fill="#E27625" stroke="#E27625" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M28.2295 23.5334L24.7346 28.872L32.2271 30.9323L34.3827 23.6501L28.2295 23.5334Z" fill="#E27625" stroke="#E27625" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M1.27271 23.6501L3.41669 30.9323L10.8976 28.872L7.41433 23.5334L1.27271 23.6501Z" fill="#E27625" stroke="#E27625" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10.4706 14.5149L8.39209 17.6507L15.7968 17.9891L15.5425 10.0149L10.4706 14.5149Z" fill="#E27625" stroke="#E27625" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M25.1505 14.5149L19.9953 9.92346L19.8241 17.9891L27.2288 17.6507L25.1505 14.5149Z" fill="#E27625" stroke="#E27625" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10.8978 28.8721L15.3395 26.7068L11.5046 23.7001L10.8978 28.8721Z" fill="#E27625" stroke="#E27625" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20.2817 26.7068L24.7349 28.8721L24.1165 23.7001L20.2817 26.7068Z" fill="#E27625" stroke="#E27625" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24.7349 28.8721L20.2817 26.7068L20.6428 29.6218L20.6079 30.841L24.7349 28.8721Z" fill="#D5BFB2" stroke="#D5BFB2" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10.8978 28.8721L15.0248 30.841L15.0015 29.6218L15.3395 26.7068L10.8978 28.8721Z" fill="#D5BFB2" stroke="#D5BFB2" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15.1082 21.7842L11.3899 20.6934L14.0173 19.4859L15.1082 21.7842Z" fill="#233447" stroke="#233447" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20.5129 21.7842L21.6038 19.4859L24.2428 20.6934L20.5129 21.7842Z" fill="#233447" stroke="#233447" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10.8976 28.872L11.5277 23.5334L7.41431 23.6501L10.8976 28.872Z" fill="#CC6228" stroke="#CC6228" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24.1049 23.5334L24.7349 28.872L28.2182 23.6501L24.1049 23.5334Z" fill="#CC6228" stroke="#CC6228" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M27.2288 17.6506L19.8241 17.989L20.5126 21.7842L21.6035 19.4859L24.2425 20.6934L27.2288 17.6506Z" fill="#CC6228" stroke="#CC6228" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11.3899 20.6934L14.0173 19.4859L15.1082 21.7842L15.7968 17.989L8.39209 17.6506L11.3899 20.6934Z" fill="#CC6228" stroke="#CC6228" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8.39209 17.6506L11.5046 23.7L11.3899 20.6934L8.39209 17.6506Z" fill="#E27625" stroke="#E27625" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24.2428 20.6934L24.1165 23.7L27.2291 17.6506L24.2428 20.6934Z" fill="#E27625" stroke="#E27625" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15.7968 17.989L15.1082 21.7842L15.9684 26.0459L16.1646 20.3551L15.7968 17.989Z" fill="#E27625" stroke="#E27625" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19.8241 17.989L19.4679 20.3434L19.6525 26.0459L20.5127 21.7842L19.8241 17.989Z" fill="#E27625" stroke="#E27625" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20.5129 21.7842L19.6527 26.0459L20.2827 26.7068L24.1175 23.7001L24.2438 20.6934L20.5129 21.7842Z" fill="#F5841F" stroke="#F5841F" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11.3899 20.6934L11.5046 23.7001L15.3394 26.7068L15.9694 26.0459L15.1092 21.7842L11.3899 20.6934Z" fill="#F5841F" stroke="#F5841F" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20.6079 30.841L20.6428 29.6218L20.3051 29.3301H15.3162L15.0015 29.6218L15.0248 30.841L10.8978 28.8721L12.3696 30.0912L15.2696 32.0951H20.3517L23.2634 30.0912L24.7349 28.8721L20.6079 30.841Z" fill="#C0AC9D" stroke="#C0AC9D" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20.2817 26.7068L19.6517 26.0459H15.9684L15.3384 26.7068L15.0007 29.6218L15.3153 29.3301H20.3042L20.6419 29.6218L20.2817 26.7068Z" fill="#161616" stroke="#161616" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M33.5168 11.3532L34.6777 5.99324L32.9582 1L20.2817 10.3932L25.1505 14.5149L32.0425 16.5285L33.5727 14.7396L32.9116 14.2587L33.9675 13.2979L33.1541 12.6719L34.21 11.8579L33.5168 11.3532Z" fill="#763E1A" stroke="#763E1A" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0.966309 5.99324L2.12717 11.3532L1.42238 11.8579L2.47827 12.6719L1.66489 13.2979L2.72079 14.2587L2.05963 14.7396L3.58994 16.5285L10.4704 14.5149L15.3392 10.3932L2.66279 1L0.966309 5.99324Z" fill="#763E1A" stroke="#763E1A" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M32.0425 16.5285L25.1505 14.5149L27.2288 17.6507L24.1162 23.7001L28.2295 23.6501H34.3828L32.0425 16.5285Z" fill="#F5841F" stroke="#F5841F" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10.4706 14.5149L3.58997 16.5285L1.27271 23.6501H7.41434L11.5277 23.7001L8.41511 17.6507L10.4706 14.5149Z" fill="#F5841F" stroke="#F5841F" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19.8241 17.9891L20.2818 10.3933L22.2666 4.99097H13.3545L15.3393 10.3933L15.7969 17.9891L15.9581 20.3668L15.9697 26.0459H19.653L19.6646 20.3668L19.8241 17.9891Z" fill="#F5841F" stroke="#F5841F" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/**
 * CSS styles for the warning modal.
 * These are isolated via Shadow DOM to prevent conflicts with host page styles.
 *
 * Design follows MetaMask extension patterns:
 * - Dark theme background: #24272A
 * - Text colors: #FFFFFF (primary), #9FA6AE (secondary)
 * - Link color: #43AEFC (blue)
 * - Danger/action color: #F66A7B (coral pink)
 * - Confirm button: #9A7B7B (muted mauve)
 */
const MODAL_STYLES = `
  :host {
    all: initial;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal {
    background: #24272A;
    border-radius: 14px;
    max-width: 360px;
    width: calc(100% - 48px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
    animation: slideUp 0.25s ease-out;
    padding: 24px;
  }

  .modal.hidden {
    display: none;
  }

  .header {
    text-align: center;
    margin-bottom: 20px;
  }

  .fox {
    width: 40px;
    height: 40px;
    margin: 0 auto 20px;
  }

  .title {
    color: #FFFFFF;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 8px;
    line-height: 1.4;
    letter-spacing: -0.2px;
  }

  .subtitle {
    color: #9FA6AE;
    font-size: 14px;
    margin: 0;
    line-height: 1.5;
  }

  .body {
    margin-bottom: 24px;
  }

  .warning-text {
    color: #9FA6AE;
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 8px;
  }

  .learn-link {
    color: #43AEFC;
    font-size: 14px;
    text-decoration: underline;
    cursor: pointer;
    display: inline-block;
  }

  .learn-link:hover {
    color: #6BC1FF;
  }

  .checkbox-container {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 24px;
    cursor: pointer;
    padding: 4px 0;
  }

  .checkbox {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border: 2px solid #6A737D;
    border-radius: 4px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    margin-top: 2px;
  }

  .checkbox:hover {
    border-color: #9FA6AE;
  }

  .checkbox.checked {
    background: #43AEFC;
    border-color: #43AEFC;
  }

  .checkbox svg {
    width: 12px;
    height: 12px;
    color: #FFFFFF;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .checkbox.checked svg {
    opacity: 1;
  }

  .checkbox-label {
    color: #FFFFFF;
    font-size: 14px;
    line-height: 1.5;
  }

  .footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .footer-horizontal {
    display: flex;
    gap: 16px;
  }

  .footer-horizontal .btn {
    flex: 1;
  }

  .btn {
    width: 100%;
    padding: 12px 16px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    outline: none;
    text-align: center;
  }

  .btn:focus-visible {
    box-shadow: 0 0 0 2px #24272A, 0 0 0 4px #43AEFC;
  }

  .btn-primary {
    background: #FFFFFF;
    color: #24272A;
  }

  .btn-primary:hover {
    background: #F2F4F6;
  }

  .btn-primary:active {
    background: #E5E8EB;
    transform: scale(0.98);
  }

  .btn-danger {
    background: #F66A7B;
    color: #24272A;
  }

  .btn-danger:hover {
    background: #FF7A8A;
  }

  .btn-danger:active {
    background: #E85A6B;
    transform: scale(0.98);
  }

  .btn-secondary {
    background: transparent;
    color: #FFFFFF;
    border: 1px solid #5B6068;
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: #8A9098;
  }

  .btn-secondary:active {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(0.98);
  }

  .btn-confirm {
    background: #9A7B7B;
    color: #FFFFFF;
  }

  .btn-confirm:hover {
    background: #AA8B8B;
  }

  .btn-confirm:active {
    background: #8A6B6B;
    transform: scale(0.98);
  }
`;

/**
 * HTML template for the initial warning modal.
 */
const MODAL_HTML_WARNING = `
  <div class="modal" id="warning-modal" role="alertdialog" aria-modal="true" aria-labelledby="srp-title" aria-describedby="srp-desc">
    <div class="header">
      <div class="fox">${METAMASK_FOX_SVG}</div>
      <h2 class="title" id="srp-title">Seed Recovery Phrase paste blocked</h2>
      <p class="subtitle">MetaMask blocked this paste to protect your wallet.</p>
    </div>

    <div class="body">
      <p class="warning-text" id="srp-desc">Never share your Secret Recovery Phrase. Anyone with these words can take everything from your wallet permanently.</p>
      <a class="learn-link" href="https://support.metamask.io/privacy-and-security/what-is-a-secret-recovery-phrase-and-how-to-keep-your-crypto-wallet-secure/" target="_blank" rel="noopener noreferrer">Learn why this is dangerous.</a>
    </div>

    <div class="footer">
      <button class="btn btn-primary" id="exit-btn">Leave this site</button>
      <button class="btn btn-danger" id="continue-btn">Continue anyway</button>
    </div>
  </div>
`;

/**
 * HTML template for the confirmation modal.
 */
const MODAL_HTML_CONFIRM = `
  <div class="modal hidden" id="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc">
    <div class="header">
      <div class="fox">${METAMASK_FOX_SVG}</div>
      <h2 class="title" id="confirm-title">Are you sure?</h2>
      <p class="subtitle" id="confirm-desc">If you check the box below and confirm, we won't show this modal any more.</p>
    </div>

    <div class="checkbox-container" id="checkbox-container">
      <div class="checkbox" id="checkbox">
        <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="checkbox-label">I understand the risks. Do not show this again</span>
    </div>

    <div class="footer footer-horizontal">
      <button class="btn btn-secondary" id="cancel-btn">Cancel</button>
      <button class="btn btn-confirm" id="confirm-btn">Confirm</button>
    </div>
  </div>
`;

/** Unique ID for the warning modal host element */
const MODAL_HOST_ID = 'metamask-seed-phrase-warning';

/** Storage key for "don't show again" preference */
const STORAGE_KEY = 'metamask-srp-warning-dismissed';

/**
 * Checks if the user has previously dismissed the warning permanently.
 *
 * @returns True if user chose "don't show again"
 */
export function isWarningDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // localStorage may not be available in some contexts
    return false;
  }
}

/**
 * Saves the user's preference to not show the warning again.
 */
function setWarningDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // localStorage may not be available in some contexts
  }
}

/**
 * Creates the warning modal using Shadow DOM for style isolation.
 *
 * @param onExitSite - Callback when user clicks "Leave this site"
 * @param onIgnore - Callback when user clicks to proceed (with optional permanent dismissal)
 * @returns The host element containing the shadow DOM modal
 */
export function createWarningModal(
  onExitSite: () => void,
  onIgnore: (dontShowAgain: boolean) => void,
): HTMLElement {
  // Create host element
  const host = document.createElement('div');
  host.id = MODAL_HOST_ID;

  // Attach shadow DOM for style isolation
  const shadow = host.attachShadow({ mode: 'closed' });

  // Add styles
  const styleElement = document.createElement('style');
  styleElement.textContent = MODAL_STYLES;
  shadow.appendChild(styleElement);

  // Add overlay container
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  shadow.appendChild(overlay);

  // Add warning modal HTML
  const warningContainer = document.createElement('div');
  warningContainer.innerHTML = MODAL_HTML_WARNING;
  overlay.appendChild(warningContainer.firstElementChild as HTMLElement);

  // Add confirmation modal HTML
  const confirmContainer = document.createElement('div');
  confirmContainer.innerHTML = MODAL_HTML_CONFIRM;
  overlay.appendChild(confirmContainer.firstElementChild as HTMLElement);

  // Get modal elements
  const warningModal = shadow.querySelector('#warning-modal') as HTMLElement;
  const confirmModal = shadow.querySelector('#confirm-modal') as HTMLElement;

  // Get button elements
  const exitBtn = shadow.querySelector('#exit-btn');
  const continueBtn = shadow.querySelector('#continue-btn');
  const cancelBtn = shadow.querySelector('#cancel-btn');
  const confirmBtn = shadow.querySelector('#confirm-btn') as HTMLButtonElement;
  const checkboxContainer = shadow.querySelector('#checkbox-container');
  const checkbox = shadow.querySelector('#checkbox') as HTMLElement;

  // Track checkbox state
  let isChecked = false;

  // Exit site handler
  exitBtn?.addEventListener('click', () => {
    onExitSite();
    host.remove();
  });

  // Continue anyway -> show confirmation modal
  continueBtn?.addEventListener('click', () => {
    warningModal.classList.add('hidden');
    confirmModal.classList.remove('hidden');
  });

  // Cancel -> go back to warning modal
  cancelBtn?.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    warningModal.classList.remove('hidden');
    // Reset checkbox state
    isChecked = false;
    checkbox.classList.remove('checked');
  });

  // Checkbox toggle
  checkboxContainer?.addEventListener('click', () => {
    isChecked = !isChecked;
    checkbox.classList.toggle('checked', isChecked);
  });

  // Confirm handler
  confirmBtn?.addEventListener('click', () => {
    if (isChecked) {
      setWarningDismissed();
    }
    onIgnore(isChecked);
    host.remove();
  });

  // Close on Escape key
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      // If on confirm modal, go back to warning modal
      if (!confirmModal.classList.contains('hidden')) {
        confirmModal.classList.add('hidden');
        warningModal.classList.remove('hidden');
        isChecked = false;
        checkbox.classList.remove('checked');
      } else {
        // If on warning modal, close and ignore
        onIgnore(false);
        host.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    }
  };
  document.addEventListener('keydown', handleEscape);

  return host;
}

/**
 * Navigates away from the current site to protect the user.
 * Tries multiple strategies in order of preference.
 */
function exitSite(): void {
  // Strategy 1: Try to go back in history (if user came from a safe page)
  // This is the best UX if they accidentally landed on this page
  if (window.history.length > 1) {
    window.history.back();

    // Give history.back() a moment to work, then fallback
    setTimeout(() => {
      // If we're still on the same page after 100ms, navigate away
      // This handles cases where history.back() didn't work
      window.location.replace('about:blank');
    }, 100);
    return;
  }

  // Strategy 2: Replace current page with blank page
  // Using replace() so user can't navigate forward back to the malicious site
  window.location.replace('about:blank');
}

/**
 * Result of the warning modal interaction.
 */
export type WarningModalResult = {
  action: 'exit' | 'ignore';
  dontShowAgain: boolean;
};

/**
 * Shows the seed phrase warning modal.
 *
 * @returns Promise that resolves with the user's action and preference
 */
export function showWarningModal(): Promise<WarningModalResult> {
  return new Promise((resolve) => {
    // Check if user has previously dismissed the warning permanently
    if (isWarningDismissed()) {
      resolve({ action: 'ignore', dontShowAgain: true });
      return;
    }

    // Remove any existing modal
    const existingModal = document.getElementById(MODAL_HOST_ID);
    if (existingModal) {
      existingModal.remove();
    }

    const modal = createWarningModal(
      () => {
        // Exit site - navigate away from the malicious page
        exitSite();
        resolve({ action: 'exit', dontShowAgain: false });
      },
      (dontShowAgain: boolean) => {
        resolve({ action: 'ignore', dontShowAgain });
      },
    );

    document.body.appendChild(modal);

    // Focus the exit button for accessibility
    const shadow = modal.shadowRoot;
    if (shadow) {
      const exitBtn = shadow.querySelector('#exit-btn') as HTMLButtonElement;
      exitBtn?.focus();
    }
  });
}

/**
 * Removes the warning modal if it exists.
 */
export function removeWarningModal(): void {
  const modal = document.getElementById(MODAL_HOST_ID);
  if (modal) {
    modal.remove();
  }
}
