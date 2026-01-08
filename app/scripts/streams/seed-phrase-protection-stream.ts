/**
 * Seed Phrase Protection Stream
 *
 * This module intercepts paste events on web pages and warns users
 * when they attempt to paste a seed phrase on any website.
 *
 * It excludes extension pages (chrome-extension://, moz-extension://) since
 * those are trusted contexts where seed phrase entry may be legitimate
 * (e.g., wallet import flows within MetaMask itself).
 */

import { isDefinitelySeedPhrase } from '../../../shared/modules/seed-phrase-detection';
import { showWarningModal } from './seed-phrase-protection-ui';

/**
 * Checks if the current page is an extension page.
 * Extension pages are trusted contexts where seed phrase protection should not run.
 *
 * @returns True if running on a browser extension page
 */
function isExtensionPage(): boolean {
  try {
    const { protocol, origin } = window.location;

    // Check for Chrome/Edge extension protocol
    if (protocol === 'chrome-extension:') {
      return true;
    }

    // Check for Firefox extension protocol
    if (protocol === 'moz-extension:') {
      return true;
    }

    // Handle edge case where origin is null (can happen in some sandboxed contexts)
    // In extension contexts, this shouldn't block us, but we check protocol above
    if (origin === 'null' && protocol.includes('extension')) {
      return true;
    }

    return false;
  } catch {
    // If we can't access location (e.g., sandboxed iframe), err on the side of caution
    // and don't enable protection (it likely won't work properly anyway)
    return true;
  }
}

// Track if we should allow paste (after user ignores warning)
let allowNextPaste = false;

/**
 * Handles paste events to detect seed phrases.
 *
 * @param event - The clipboard paste event
 */
function handlePaste(event: ClipboardEvent): void {
  // If user has chosen to ignore the warning, allow this paste
  if (allowNextPaste) {
    allowNextPaste = false;
    return;
  }

  const { clipboardData } = event;
  if (!clipboardData) {
    return;
  }

  const pastedText = clipboardData.getData('text');
  if (!pastedText) {
    return;
  }

  // Check if this is a seed phrase
  if (isDefinitelySeedPhrase(pastedText)) {
    // Prevent the paste
    event.preventDefault();
    event.stopPropagation();

    // Show the warning modal
    showWarningModal().then((result) => {
      if (result === 'ignore') {
        // User chose to ignore, allow the next paste
        allowNextPaste = true;

        // Inform the user to paste again
        console.log(
          'MetaMask: Seed phrase protection bypassed. You may paste again.',
        );
      }
    });
  }
}

/**
 * Initializes seed phrase protection on the page.
 * This should be called early in the content script lifecycle.
 *
 * Protection is NOT enabled on:
 * - Extension pages (chrome-extension://, moz-extension://)
 * - These are trusted contexts where seed phrase entry is legitimate
 */
export function initSeedPhraseProtection(): void {
  // Skip protection on extension pages - these are trusted contexts
  if (isExtensionPage()) {
    return;
  }

  // Add paste event listener to the document
  // Use capture phase to intercept before the target receives it
  document.addEventListener('paste', handlePaste, { capture: true });

  console.log('MetaMask: Seed phrase protection initialized');
}

// Export for testing
export { isExtensionPage };
