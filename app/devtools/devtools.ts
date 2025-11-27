// devtools/panel-creator.js

// This file is responsible for creating a custom panel within the browser's DevTools interface.
// The 'webextension-polyfill' library ensures compatibility across different browser platforms (Chrome, Firefox, etc.).
import browser from 'webextension-polyfill';

// Define constants for configuration to improve readability and maintainability.
const PANEL_TITLE = 'MetaMask Kernel Panel';
const PANEL_ICON = 'images/icon-16.png';
const PANEL_HTML_PATH = 'devtools/ocap-kernel/kernel-panel.html';

/**
 * Asynchronously creates the custom DevTools panel.
 * Logs a message on success for debugging and confirmation.
 */
async function createDevToolsPanel() {
  try {
    await browser.devtools.panels.create(
      PANEL_TITLE,
      PANEL_ICON,
      PANEL_HTML_PATH,
    );
    // Log success message in the extension's background script console
    console.log(`DevTools panel '${PANEL_TITLE}' created successfully.`);
  } catch (error) {
    // Log an error if the panel creation fails (e.g., incorrect path, permission issues).
    console.error(`Error creating DevTools panel '${PANEL_TITLE}':`, error);
  }
}

// Execute the panel creation logic.
createDevToolsPanel();
