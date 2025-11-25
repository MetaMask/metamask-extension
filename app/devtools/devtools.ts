///: BEGIN:ONLY_INCLUDE_IF(ocap-kernel)
import browser from 'webextension-polyfill';

// Define constants for resource paths for better readability
const PANEL_TITLE = 'MetaMask Kernel Panel';
const ICON_PATH = 'images/icon-16.png';
const HTML_PATH = 'devtools/ocap-kernel/kernel-panel.html';

/**
 * Creates a custom panel within the browser's Developer Tools interface.
 */
async function createKernelDevToolsPanel() {
  try {
    // browser.devtools.panels.create returns a promise that resolves when the panel is created.
    await browser.devtools.panels.create(
      PANEL_TITLE,
      ICON_PATH,
      HTML_PATH,
    );
    console.log(`Successfully created DevTools panel: ${PANEL_TITLE}`);
  } catch (error) {
    // Robust error handling for failure during panel creation
    console.error(`Failed to create DevTools panel: ${PANEL_TITLE}`, error);
  }
}

// Immediately invoke the async function to start panel creation
createKernelDevToolsPanel();
///: END:ONLY_INCLUDE_IF(ocap-kernel)
