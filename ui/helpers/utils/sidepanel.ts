/**
 * Opens the side panel in the current window and closes the current popup/window.
 * @returns true if successful, false if sidepanel API not available
 */
export async function openSidepanel(): Promise<boolean> {
  if (!chrome.sidePanel?.open) {
    return false;
  }

  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tabs?.[0]?.windowId) {
      await chrome.sidePanel.open({ windowId: tabs[0].windowId });
      window.close();
      return true;
    }
  } catch {
    // Silently fail
  }

  return false;
}

