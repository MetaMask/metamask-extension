# MetaMask Side Panel Feature

The MetaMask side panel feature allows users to open MetaMask in a persistent sidebar in Chrome browsers using Manifest V3. This provides an alternative way to interact with MetaMask that doesn't block the main browsing experience.

**🎯 Default Behavior**: Starting with this version, MetaMask will attempt to open in the side panel by default on supported browsers (MV3 Chrome builds), falling back to the traditional popup when the side panel is not available or fails to open.

## Requirements

- **Browser**: Chrome 114+ (where Side Panel API is available)
- **Manifest**: V3 only
- **Platform**: Not available in Firefox

## User Access Methods

### 1. Automatic Default (NEW)

When MetaMask needs to show its interface (e.g., for transaction confirmations), it will automatically try to open in the side panel first, then fall back to a popup if needed.

### 2. Keyboard Shortcut

Users can press `Alt+Shift+S` to open MetaMask in the side panel.

### 3. Context Menu

Users can right-click on the MetaMask extension icon and select "Open MetaMask in side panel".

## Developer Usage

### Important: User Gesture Requirement

⚠️ **CRITICAL**: The `sidePanel.open()` API can only be called in response to a user gesture. This means:

- ✅ **Works**: Button clicks, keyboard shortcuts, context menu selections
- ❌ **Fails**: Automatic calls, timer-based calls, API responses

### Platform API

```javascript
import ExtensionPlatform from './platforms/extension';

const platform = new ExtensionPlatform();

// Check if side panel is supported
if (platform.isSidePanelSupported()) {
  // Try to open side panel (graceful fallback)
  const sidePanelOpened = await platform.tryOpenSidePanel();
  if (!sidePanelOpened) {
    // Handle fallback to popup or show error
    console.log('Side panel not available, using popup');
  }

  // Or force open side panel (must be called from user gesture handler)
  try {
    await platform.openSidePanel();
    // Or with specific tab ID:
    // await platform.openSidePanel(tabId);
  } catch (error) {
    if (error.message.includes('user gesture')) {
      console.error('Side panel must be opened from a user action');
    }
  }
}
```

### Background Script Integration

The background script automatically handles the default behavior:

1. **Automatic Preference**: When `triggerUi()` is called, it first attempts to open the side panel
2. **Graceful Fallback**: If the side panel fails or is unavailable, it falls back to the traditional popup
3. **User Gestures**: Still handles keyboard shortcuts (`Alt+Shift+S`) and context menu
4. **Error Handling**: Manages user gesture requirements and API availability

### UI Integration Example

```javascript
// In a React component or UI handler
const handleOpenSidePanel = async () => {
  // Use the graceful fallback method
  const sidePanelOpened = await platform.tryOpenSidePanel();
  if (!sidePanelOpened) {
    console.log('Side panel not available, will use popup instead');
    // The system will automatically fall back to popup
  }
};

// JSX
<button onClick={handleOpenSidePanel}>Open MetaMask</button>;
```

## Technical Implementation

### Manifest Configuration

The side panel is configured in the Chrome manifest:

```json
{
  "commands": {
    "open_side_panel": {
      "suggested_key": {
        "default": "Alt+Shift+S"
      },
      "description": "Open MetaMask in side panel"
    }
  },
  "permissions": ["sidePanel", "contextMenus"],
  "side_panel": {
    "default_path": "home.html"
  }
}
```

### Error Handling

The implementation includes specific error handling for:

- User gesture requirement violations
- API availability checks
- Browser compatibility issues

### Testing

Comprehensive tests cover:

- Successful side panel opening
- User gesture error handling
- API availability checks
- Error state management

## Browser Support

| Browser | Version | Support          |
| ------- | ------- | ---------------- |
| Chrome  | 114+    | ✅ Full          |
| Firefox | Any     | ❌ Not supported |
| Edge    | 114+    | ✅ Full          |
| Safari  | Any     | ❌ Not supported |

## Troubleshooting

### "User gesture" Error

This error occurs when trying to open the side panel without a user interaction. Ensure the `openSidePanel()` call is made directly from:

- Click event handlers
- Keyboard event handlers
- Context menu handlers

### Side Panel Not Opening

1. Check if browser supports the API: `platform.isSidePanelSupported()`
2. Ensure the call is made from a user gesture
3. Check browser console for specific error messages

### API Not Available

The side panel API is only available in Chrome 114+ with Manifest V3. The implementation gracefully degrades on unsupported browsers.
