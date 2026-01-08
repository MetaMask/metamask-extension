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

import browser from 'webextension-polyfill';
import { isSeedPhrase } from '../../../shared/modules/seed-phrase-detection';
import { showWarningModal } from './seed-phrase-protection-ui';

/**
 * Event types for seed phrase protection metrics.
 * These are sent to the background script for tracking.
 */
export enum SeedPhraseProtectionEventType {
  ModalDisplayed = 'srpModalDisplayed',
  ExitSiteClicked = 'srpExitSiteClicked',
  ProceedAnyway = 'srpProceedAnyway',
}

/**
 * Message structure for seed phrase protection metrics.
 */
type SeedPhraseProtectionMessage = {
  type: 'SEED_PHRASE_PROTECTION_METRIC';
  event: SeedPhraseProtectionEventType;
  properties: {
    url: string;
    hostname: string;
    wordCount?: number;
  };
};

/**
 * Sends a metric event to the background script.
 * The background script will handle the actual tracking via MetaMetricsController.
 *
 * @param event - The event type
 * @param additionalProperties - Additional properties to include
 */
function sendMetricToBackground(
  event: SeedPhraseProtectionEventType,
  additionalProperties: Record<string, unknown> = {},
): void {
  try {
    const message: SeedPhraseProtectionMessage = {
      type: 'SEED_PHRASE_PROTECTION_METRIC',
      event,
      properties: {
        url: window.location.href,
        hostname: window.location.hostname,
        ...additionalProperties,
      },
    };

    // Fire and forget - we don't need to wait for a response
    browser.runtime.sendMessage(message).catch(() => {
      // Silently ignore errors (e.g., if background is not ready)
      // Metrics are best-effort, not critical functionality
    });
  } catch {
    // Silently ignore - metrics should never break core functionality
  }
}

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

  // Check if this is a seed phrase (12 or 24 words, all valid BIP39)
  if (isSeedPhrase(pastedText)) {
    // Prevent the paste
    event.preventDefault();
    event.stopPropagation();

    // Track that the modal is being displayed (single event for paste detection + modal)
    const wordCount = pastedText.trim().split(/\s+/u).length;
    sendMetricToBackground(SeedPhraseProtectionEventType.ModalDisplayed, {
      wordCount,
    });

    // Show the warning modal
    showWarningModal().then((result) => {
      if (result === 'ignore') {
        // Track that user clicked "Proceed anyway"
        sendMetricToBackground(SeedPhraseProtectionEventType.ProceedAnyway);

        // User chose to ignore, allow the next paste
        allowNextPaste = true;

        // Inform the user to paste again
        console.log(
          'MetaMask: Seed phrase protection bypassed. You may paste again.',
        );
      } else {
        // Track that user chose to exit site
        sendMetricToBackground(SeedPhraseProtectionEventType.ExitSiteClicked);
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
export { isExtensionPage, sendMetricToBackground };
