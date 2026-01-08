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
    font-family: 'Euclid Circular B', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  * {
    box-sizing: border-box;
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
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal {
    background: #FFFFFF;
    border-radius: 14px;
    max-width: 400px;
    width: calc(100% - 32px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
    animation: slideUp 0.2s ease-out;
    overflow: hidden;
  }

  .header {
    background: linear-gradient(180deg, #FFF5F5 0%, #FFFFFF 100%);
    padding: 24px 24px 20px;
    text-align: center;
    border-bottom: 1px solid #F2F4F6;
  }

  .fox {
    width: 48px;
    height: 48px;
    margin: 0 auto 12px;
  }

  .title {
    color: #D73847;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 4px;
    line-height: 1.3;
  }

  .subtitle {
    color: #535A61;
    font-size: 14px;
    margin: 0;
    line-height: 1.4;
  }

  .body {
    padding: 20px 24px;
  }

  .alert {
    background: #FEF5F5;
    border: 1px solid #F8D6D6;
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .alert-icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    color: #D73847;
  }

  .alert-text {
    color: #24272A;
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
  }

  .alert-text strong {
    font-weight: 600;
  }

  .footer {
    padding: 0 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn {
    width: 100%;
    padding: 13px 16px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.12s ease;
    border: none;
    outline: none;
  }

  .btn:focus-visible {
    box-shadow: 0 0 0 3px rgba(3, 125, 214, 0.3);
  }

  .btn-danger {
    background: #D73847;
    color: #FFFFFF;
  }

  .btn-danger:hover {
    background: #C53141;
  }

  .btn-danger:active {
    background: #B32B3B;
  }

  .btn-secondary {
    background: #FFFFFF;
    color: #24272A;
    border: 1px solid #BBC0C5;
  }

  .btn-secondary:hover {
    background: #F2F4F6;
  }

  .btn-secondary:active {
    background: #E5E8EB;
  }

  .protected-by {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding-top: 8px;
  }

  .protected-by span {
    color: #9FA6AE;
    font-size: 11px;
    font-weight: 500;
  }

  .protected-by svg {
    width: 14px;
    height: 14px;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .modal {
      background: #24272A;
    }

    .header {
      background: linear-gradient(180deg, #2C2F33 0%, #24272A 100%);
      border-bottom-color: #3B4046;
    }

    .title {
      color: #FF6B6B;
    }

    .subtitle {
      color: #9FA6AE;
    }

    .alert {
      background: rgba(215, 56, 71, 0.1);
      border-color: rgba(215, 56, 71, 0.2);
    }

    .alert-text {
      color: #FFFFFF;
    }

    .btn-secondary {
      background: #3B4046;
      color: #FFFFFF;
      border-color: #4A5058;
    }

    .btn-secondary:hover {
      background: #4A5058;
    }

    .btn-secondary:active {
      background: #5A6068;
    }

    .protected-by span {
      color: #6A737D;
    }
  }
`;

/**
 * HTML template for the warning modal.
 */
const MODAL_HTML = `
  <div class="overlay">
    <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="srp-title" aria-describedby="srp-desc">
      <div class="header">
        <div class="fox">${METAMASK_FOX_SVG}</div>
        <h2 class="title" id="srp-title">Seed phrase detected</h2>
        <p class="subtitle">MetaMask blocked this paste to protect your wallet</p>
      </div>

      <div class="body">
        <div class="alert">
          <svg class="alert-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" fill="currentColor"/>
          </svg>
          <p class="alert-text" id="srp-desc">
            <strong>Never share your Secret Recovery Phrase.</strong> Anyone with these words can take everything from your wallet permanently.
          </p>
        </div>
      </div>

      <div class="footer">
        <button class="btn btn-danger" id="exit-btn">
          Leave this site
        </button>
        <button class="btn btn-secondary" id="ignore-btn">
          Proceed anyway
        </button>
        <div class="protected-by">
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1L2 3.5V7.5C2 11.09 4.56 14.44 8 15.5C11.44 14.44 14 11.09 14 7.5V3.5L8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.5 8L7.16667 9.5L10.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Protected by MetaMask</span>
        </div>
      </div>
    </div>
  </div>
`;

/** Unique ID for the warning modal host element */
const MODAL_HOST_ID = 'metamask-seed-phrase-warning';

/**
 * Creates the warning modal using Shadow DOM for style isolation.
 *
 * @param onExitSite - Callback when user clicks "Leave this site"
 * @param onIgnore - Callback when user clicks "I understand the risks"
 * @returns The host element containing the shadow DOM modal
 */
export function createWarningModal(
  onExitSite: () => void,
  onIgnore: () => void,
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

  // Add HTML content
  const container = document.createElement('div');
  container.innerHTML = MODAL_HTML;
  shadow.appendChild(container);

  // Set up event handlers
  const exitBtn = shadow.querySelector('#exit-btn');
  const ignoreBtn = shadow.querySelector('#ignore-btn');

  exitBtn?.addEventListener('click', () => {
    onExitSite();
    host.remove();
  });

  ignoreBtn?.addEventListener('click', () => {
    onIgnore();
    host.remove();
  });

  // Close on Escape key
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onIgnore();
      host.remove();
      document.removeEventListener('keydown', handleEscape);
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
 * Shows the seed phrase warning modal.
 *
 * @returns Promise that resolves to 'exit' if user leaves, 'ignore' if user bypasses
 */
export function showWarningModal(): Promise<'exit' | 'ignore'> {
  return new Promise((resolve) => {
    // Remove any existing modal
    const existingModal = document.getElementById(MODAL_HOST_ID);
    if (existingModal) {
      existingModal.remove();
    }

    const modal = createWarningModal(
      () => {
        // Exit site - navigate away from the malicious page
        exitSite();
        resolve('exit');
      },
      () => {
        resolve('ignore');
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
