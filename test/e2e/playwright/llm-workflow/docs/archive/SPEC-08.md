# SPEC-08 — Multi-Tab Management and Popup Window Interaction

This spec updates the `llm-workflow` MCP server to improve **multi-tab management** and enable **direct interaction with popup windows** (notification pages), allowing LLM agents to click, type, and interact with elements in notification popups—not just detect that they opened.

---

## 0) Scope

### In scope

- Track multiple browser tabs (dapp pages, notification pages, home page)
- Provide navigation to notification pages in **separate tabs** (not replacing dapp tab)
- **Enable interaction with popup windows** via `mm_click`, `mm_type`, `mm_wait_for`
- Active page switching to control which page receives interactions
- Graceful page closure after notification handling
- Preserve dapp tab state during MetaMask confirmation flows
- Improve `mm_navigate` to support multi-tab workflows

### Not in scope

- Headless mode changes (covered separately if needed)
- Testing the browser-action popup (extension toolbar popup)
- MV2 / Firefox
- Visual regression diffs
- Changing the knowledge store schema

---

## 1) Background

### Current Problem

**Problem 1: Navigation replaces current tab**

When navigating to `notification.html` using `mm_navigate({ screen: 'notification' })`, the current implementation navigates in the **current tab**. This causes issues:

1. **Dapp state is lost** - Navigating away from test-dapp tab replaces the page content
2. **Test flow is broken** - After confirming in notification, user must navigate back to dapp
3. **Dapp context changes** - JavaScript state, form inputs, and connection status may be reset

**Problem 2: Cannot interact with notification popups (CRITICAL)**

Even when `mm_wait_for_notification` successfully detects and returns the notification page:

1. **Interaction tools use the wrong page** - `mm_click`, `mm_type`, `mm_wait_for` all call `sessionManager.getPage()` which returns `extensionPage`
2. **`extensionPage` is never updated** - It's only set once during `waitForExtensionReady()` and never changes
3. **No way to switch active page** - Agent cannot direct interactions to the notification popup
4. **Discovery tools also affected** - `mm_describe_screen`, `mm_list_testids`, `mm_accessibility_snapshot` all operate on the wrong page

**Current broken flow:**

```
mm_launch                          → extensionPage = home.html
mm_navigate({ url: 'test-dapp' })  → extensionPage still = home.html (!)
mm_wait_for_notification           → returns notification Page, but extensionPage unchanged
mm_click({ testId: 'confirm-btn'}) → clicks on home.html, NOT notification! ❌
```

### Expected Behavior

1. **Notification pages should open in separate tabs** - Not replace the dapp tab
2. **Multiple tabs should be tracked** - Agent should know which tab is dapp, which is notification
3. **Active page should be switchable** - Agent can direct interactions to any tracked page
4. **Interaction tools should operate on active page** - `mm_click`, `mm_type`, etc. should work on notification popups
5. **After notification handling** - User can return to dapp tab without losing state
6. **Page closure** - Notification tabs can be closed after confirmation

**Expected working flow:**

```
mm_launch                          → activePage = home.html
mm_navigate({ url: 'test-dapp' })  → activePage = test-dapp (dapp tab tracked)
mm_wait_for_notification           → activePage = notification.html ✅
mm_describe_screen                 → shows notification page elements ✅
mm_click({ testId: 'confirm-btn'}) → clicks on notification page ✅
mm_switch_to_tab({ role: 'dapp' }) → activePage = test-dapp ✅
```

---

## 2) Goals

1. Track and manage multiple browser tabs in a session
2. Navigate to notification pages without disrupting dapp tabs
3. **Enable interaction with notification popup windows**
4. Provide active page switching mechanism
5. Provide clear tab identification in state responses
6. Support graceful tab switching and closure
7. Maintain backward compatibility with existing single-tab workflows

---

## 3) Design Summary

### 3.1 Tab Tracking Model

Track pages by role:

| Role           | Description                                       |
| -------------- | ------------------------------------------------- |
| `extension`    | Main extension page (`home.html`)                 |
| `notification` | Confirmation/approval pages (`notification.html`) |
| `dapp`         | External dapp pages (any non-extension URL)       |
| `other`        | Other extension or browser pages                  |

### 3.2 Active Page Concept (NEW)

Introduce an **active page** that all interaction tools operate on:

```typescript
class SessionManager {
  private activePage: Page | undefined; // NEW: The page that receives interactions

  getPage(): Page {
    return this.activePage; // Tools use this
  }

  setActivePage(page: Page): void {
    this.activePage = page;
  }
}
```

**Automatic page switching:**

| Action                                    | Active Page Becomes      |
| ----------------------------------------- | ------------------------ |
| `mm_launch`                               | Extension home page      |
| `mm_navigate({ screen: 'home' })`         | Extension home page      |
| `mm_navigate({ screen: 'url' })`          | The new URL page         |
| `mm_wait_for_notification`                | The notification page ✅ |
| `mm_navigate({ screen: 'notification' })` | The notification page    |
| `mm_switch_to_tab({ role: '...' })`       | The specified tab        |

### 3.3 Navigation Strategy

**Current behavior (problematic):**

```
mm_navigate({ screen: 'notification' })
→ Navigates current tab to notification.html
→ Dapp state lost!
→ But interaction tools still use original extensionPage!
```

**New behavior:**

```
mm_navigate({ screen: 'notification' })
→ If notification page exists, bring it to focus
→ If not, open notification.html in a NEW tab
→ Dapp tab preserved
→ Set activePage = notification page ✅
```

### 3.4 Multi-Tab State Reporting

`mm_get_state` and `mm_describe_screen` should report:

- Current active page info (the page interactions target)
- List of tracked tabs with their roles
- Which tab is currently active

---

## 4) MCP API Changes

### 4.1 Tool: `mm_navigate`

**Existing inputs:**

- `screen`: `'home' | 'settings' | 'notification' | 'url'`
- `url`: string (when screen is 'url')

**New behavior for `screen: 'notification'`:**

1. Check if a notification page already exists in the context
2. If yes, bring that tab to focus and **set it as active page**
3. If no, create a new tab with `notification.html`
4. **Do NOT navigate the current dapp/extension tab away**
5. **Set active page to the notification page** so interactions work

**New optional input:**

- `openInNewTab?: boolean` (default: `true` for 'notification', `false` for others)

### 4.2 Tool: `mm_wait_for_notification` (ENHANCED)

**Current behavior:** Returns the notification Page object but doesn't set it as active.

**New behavior:**

1. Wait for notification page to appear
2. **Set the notification page as the active page**
3. Return success with page URL

This ensures that after calling `mm_wait_for_notification`, subsequent `mm_click`, `mm_type`, `mm_describe_screen` calls operate on the notification page.

### 4.3 Tool: `mm_get_state`

**Enhanced response:**

```typescript
{
  currentScreen: string,
  currentUrl: string,
  // ... existing fields ...
  tabs: {
    active: {
      url: string,
      role: 'extension' | 'notification' | 'dapp' | 'other'
    },
    tracked: [
      { role: 'extension', url: 'chrome-extension://.../home.html' },
      { role: 'dapp', url: 'https://metamask.github.io/test-dapp/' },
      { role: 'notification', url: 'chrome-extension://.../notification.html' }
    ]
  }
}
```

### 4.4 New Tool: `mm_switch_to_tab`

Switch the active page to a different tracked tab:

**Input:**

```typescript
{
  role?: 'extension' | 'notification' | 'dapp',  // Switch by role
  url?: string,                                   // Or switch by URL prefix
}
```

**Behavior:**

1. Find the page matching the role or URL
2. Bring it to front (`page.bringToFront()`)
3. Set it as the active page
4. Update refMap for the new page's accessibility tree
5. Return success with new active page info

**Example usage:**

```json
// Switch to notification page
mm_switch_to_tab({ "role": "notification" })

// Switch to dapp page
mm_switch_to_tab({ "role": "dapp" })

// Switch by URL
mm_switch_to_tab({ "url": "https://metamask.github.io" })
```

### 4.5 New Tool: `mm_close_tab`

Close a specific tab by role or URL:

**Input:**

```typescript
{
  role?: 'notification' | 'dapp' | 'other',  // Can't close extension
  url?: string
}
```

**Behavior:**

1. Find the page matching the role or URL
2. Close it (`page.close()`)
3. If closing the active page, switch active to extension home
4. Return success

---

## 5) Implementation Tasks

### Task 5.1 — Add active page tracking to SessionManager

**Files:**

- `test/e2e/playwright/llm-workflow/mcp-server/session-manager.ts`

**Changes:**

1. Add `activePage: Page` field to track current interaction target
2. Update `getPage()` to return `activePage`
3. Add `setActivePage(page: Page)` method
4. Add `getTrackedPages()` method to list all pages with roles
5. Update `launch()` to set initial active page

**Implementation:**

```typescript
export class SessionManager {
  private activePage: Page | undefined;

  getPage(): Page {
    if (!this.activePage) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    return this.activePage;
  }

  setActivePage(page: Page): void {
    this.activePage = page;
    this.clearRefMap(); // Clear stale refs from previous page
  }

  getTrackedPages(): Array<{ role: TabRole; url: string; page: Page }> {
    const context = this.getContext();
    const extensionId = this.activeSession?.state.extensionId;

    return context.pages().map((page) => ({
      role: this.classifyPageRole(page, extensionId),
      url: page.url(),
      page,
    }));
  }

  private classifyPageRole(page: Page, extensionId?: string): TabRole {
    const url = page.url();
    if (!extensionId) return 'other';

    const extPrefix = `chrome-extension://${extensionId}`;
    if (url.includes('notification.html')) return 'notification';
    if (url.startsWith(extPrefix)) return 'extension';
    if (url.startsWith('http')) return 'dapp';
    return 'other';
  }
}
```

### Task 5.2 — Update `mm_wait_for_notification` to set active page

**Files:**

- `test/e2e/playwright/llm-workflow/mcp-server/tools/navigation.ts`

**Changes:**

After successfully finding/waiting for notification page, **set it as active**:

```typescript
export async function handleWaitForNotification(
  input: WaitForNotificationInput,
): Promise<McpResponse<WaitForNotificationResult>> {
  // ... existing code ...

  const notificationPage =
    await sessionManager.waitForNotificationPage(timeoutMs);

  // NEW: Set notification as active page for subsequent interactions
  sessionManager.setActivePage(notificationPage);

  // Collect discovery data from the notification page (now active)
  const testIds = await collectTestIds(notificationPage, 50);
  const { nodes, refMap } = await collectTrimmedA11ySnapshot(notificationPage);
  sessionManager.setRefMap(refMap);

  // ... rest of existing code ...
}
```

### Task 5.3 — Update `mm_navigate` to set active page

**Files:**

- `test/e2e/playwright/llm-workflow/mcp-server/tools/navigation.ts`
- `test/e2e/playwright/llm-workflow/extension-launcher.ts`

**Changes:**

1. For `screen: 'notification'`: Open in new tab, set as active
2. For `screen: 'url'`: Navigate in current context, set as active
3. For `screen: 'home'`/`screen: 'settings'`: Set extension page as active

**In extension-launcher.ts:**

```typescript
async navigateToNotification(): Promise<Page> {
  const context = this.getContext();
  const notificationUrl = `chrome-extension://${this.extensionId}/notification.html`;

  // Check existing pages
  const existingNotification = context.pages()
    .find(p => p.url().includes('notification.html'));

  if (existingNotification) {
    await existingNotification.bringToFront();
    await existingNotification.waitForLoadState('domcontentloaded');
    return existingNotification;
  }

  // Open in new tab
  const newPage = await context.newPage();
  await newPage.goto(notificationUrl);
  await newPage.waitForLoadState('domcontentloaded');
  this.attachConsoleListeners(newPage);
  return newPage;
}
```

**In navigation.ts:**

```typescript
case 'notification':
  const notificationPage = await launcher.navigateToNotification();
  sessionManager.setActivePage(notificationPage);  // NEW
  break;
```

### Task 5.4 — Implement `mm_switch_to_tab` tool

**Files:**

- `test/e2e/playwright/llm-workflow/mcp-server/tools/navigation.ts`
- `test/e2e/playwright/llm-workflow/mcp-server/tool-definitions.ts`
- `test/e2e/playwright/llm-workflow/mcp-server/schemas.ts`
- `test/e2e/playwright/llm-workflow/mcp-server/tools/registry.ts`

**Implementation:**

```typescript
export async function handleSwitchToTab(
  input: SwitchToTabInput,
): Promise<McpResponse<SwitchToTabResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();

  try {
    if (!sessionManager.hasActiveSession()) {
      return createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'No active session. Call mm_launch first.',
        undefined,
        undefined,
        startTime,
      );
    }

    const trackedPages = sessionManager.getTrackedPages();
    let targetPage: Page | undefined;

    if (input.role) {
      targetPage = trackedPages.find((p) => p.role === input.role)?.page;
    } else if (input.url) {
      targetPage = trackedPages.find((p) => p.url.startsWith(input.url))?.page;
    }

    if (!targetPage) {
      return createErrorResponse(
        ErrorCodes.MM_TAB_NOT_FOUND,
        `No tab found matching: ${input.role || input.url}`,
        {
          input,
          availableTabs: trackedPages.map((p) => ({
            role: p.role,
            url: p.url,
          })),
        },
        sessionId,
        startTime,
      );
    }

    await targetPage.bringToFront();
    sessionManager.setActivePage(targetPage);

    // Collect discovery data from new active page
    const testIds = await collectTestIds(targetPage, 50);
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(targetPage);
    sessionManager.setRefMap(refMap);

    const state = await sessionManager.getExtensionState();

    await knowledgeStore.recordStep({
      sessionId: sessionId ?? '',
      toolName: 'mm_switch_to_tab',
      input,
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<SwitchToTabResult>(
      {
        switched: true,
        activeTab: {
          role:
            sessionManager.getTrackedPages().find((p) => p.page === targetPage)
              ?.role ?? 'other',
          url: targetPage.url(),
        },
      },
      sessionId,
      startTime,
    );
  } catch (error) {
    // ... error handling ...
  }
}
```

### Task 5.5 — Implement `mm_close_tab` tool

**Files:**

- `test/e2e/playwright/llm-workflow/mcp-server/tools/navigation.ts`

**Implementation:**

```typescript
export async function handleCloseTab(
  input: CloseTabInput,
): Promise<McpResponse<CloseTabResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();

  try {
    const trackedPages = sessionManager.getTrackedPages();
    let targetPage: Page | undefined;

    if (input.role) {
      if (input.role === 'extension') {
        return createErrorResponse(
          ErrorCodes.MM_INVALID_INPUT,
          'Cannot close extension home page',
          { input },
          sessionId,
          startTime,
        );
      }
      targetPage = trackedPages.find((p) => p.role === input.role)?.page;
    } else if (input.url) {
      targetPage = trackedPages.find((p) => p.url.startsWith(input.url))?.page;
    }

    if (!targetPage) {
      return createErrorResponse(
        ErrorCodes.MM_TAB_NOT_FOUND,
        `No tab found matching: ${input.role || input.url}`,
        { input },
        sessionId,
        startTime,
      );
    }

    // If closing active page, switch to extension first
    const currentActivePage = sessionManager.getPage();
    if (targetPage === currentActivePage) {
      const extensionPage = trackedPages.find(
        (p) => p.role === 'extension',
      )?.page;
      if (extensionPage) {
        await extensionPage.bringToFront();
        sessionManager.setActivePage(extensionPage);
      }
    }

    await targetPage.close();

    return createSuccessResponse<CloseTabResult>(
      { closed: true, closedUrl: targetPage.url() },
      sessionId,
      startTime,
    );
  } catch (error) {
    // ... error handling ...
  }
}
```

### Task 5.6 — Update state inspector for tab tracking

**Files:**

- `test/e2e/playwright/llm-workflow/launcher/state-inspector.ts`
- `test/e2e/playwright/llm-workflow/mcp-server/tools/state.ts`

**Changes:**

1. Add tab info to state response
2. Show which page is active

### Task 5.7 — Update types

**Files:**

- `test/e2e/playwright/llm-workflow/mcp-server/types/tool-inputs.ts`
- `test/e2e/playwright/llm-workflow/mcp-server/types/tool-outputs.ts`
- `test/e2e/playwright/llm-workflow/types.ts`

**Add:**

```typescript
export type TabRole = 'extension' | 'notification' | 'dapp' | 'other';

export type SwitchToTabInput = {
  role?: TabRole;
  url?: string;
};

export type SwitchToTabResult = {
  switched: boolean;
  activeTab: {
    role: TabRole;
    url: string;
  };
};

export type CloseTabInput = {
  role?: 'notification' | 'dapp' | 'other';
  url?: string;
};

export type CloseTabResult = {
  closed: boolean;
  closedUrl: string;
};

export type TabInfo = {
  role: TabRole;
  url: string;
};

// Enhanced state response
export type GetStateResult = {
  state: ExtensionState;
  tabs?: {
    active: TabInfo;
    tracked: TabInfo[];
  };
};
```

### Task 5.8 — Documentation updates

**Files:**

- `test/e2e/playwright/llm-workflow/README.md`
- `test/e2e/playwright/llm-workflow/mcp-server/README.md`

**Required updates:**

- Document multi-tab behavior
- Document active page concept
- Add `mm_switch_to_tab` and `mm_close_tab` to tool list
- Explain notification navigation opens new tab and sets it active
- Update workflow examples to show popup interaction

---

## 6) Acceptance Criteria

### 6.1 Notification navigation preserves dapp tab

- `mm_navigate({ screen: 'notification' })` does NOT replace dapp tab
- Dapp remains accessible after notification handling

### 6.2 Interaction with notification popups works (CRITICAL)

- After `mm_wait_for_notification`, `mm_click` operates on notification page
- After `mm_navigate({ screen: 'notification' })`, `mm_type` operates on notification page
- `mm_describe_screen` shows notification page elements, not extension home

### 6.3 Tab tracking works

- `mm_get_state` returns list of tracked tabs
- Each tab has correct role classification
- Active tab is clearly indicated

### 6.4 Tab switching works

- `mm_switch_to_tab({ role: 'dapp' })` switches active page to dapp
- `mm_switch_to_tab({ role: 'notification' })` switches to notification
- Subsequent interactions operate on the switched-to page

### 6.5 Tab closing works

- `mm_close_tab({ role: 'notification' })` closes notification tab
- If closing active tab, automatically switches to extension home
- Cannot close extension home page

### 6.6 Bring to front works

- If notification page exists, it's brought to focus
- New tab only created if notification doesn't exist

### 6.7 Backward compatibility

- `mm_navigate({ screen: 'home' })` still works as before
- `mm_navigate({ screen: 'url', url: '...' })` still works as before
- Existing single-tab workflows continue to function

---

## 7) Test Plan

### 7.1 Critical: Notification popup interaction test

```
1. mm_launch
2. mm_navigate({ screen: 'url', url: 'https://metamask.github.io/test-dapp/' })
3. [Trigger dapp action that opens notification, e.g., connect]
4. mm_wait_for_notification
5. mm_describe_screen → Verify: shows notification page elements (confirm button, etc.)
6. mm_click({ testId: 'confirm-footer-button' }) → Verify: clicks on notification, not home
7. mm_switch_to_tab({ role: 'dapp' })
8. mm_describe_screen → Verify: shows dapp elements
9. mm_cleanup
```

### 7.2 Tab preservation test

1. `mm_launch`
2. `mm_navigate({ screen: 'url', url: 'https://metamask.github.io/test-dapp/' })`
3. Click connect button on dapp
4. `mm_wait_for_notification`
5. `mm_navigate({ screen: 'notification' })` → Verify: dapp tab still exists
6. `mm_get_state` → Verify: tabs.tracked includes both dapp and notification
7. Confirm connection on notification page
8. `mm_switch_to_tab({ role: 'dapp' })` → Verify: dapp state preserved
9. `mm_cleanup`

### 7.3 Tab switching test

```
1. mm_launch
2. mm_navigate({ screen: 'url', url: 'https://metamask.github.io/test-dapp/' })
3. mm_wait_for_notification
4. mm_get_state → Verify: active tab is notification
5. mm_switch_to_tab({ role: 'extension' })
6. mm_get_state → Verify: active tab is extension
7. mm_describe_screen → Verify: shows extension home elements
8. mm_switch_to_tab({ role: 'notification' })
9. mm_describe_screen → Verify: shows notification elements
10. mm_cleanup
```

### 7.4 Tab closing test

```
1. mm_launch
2. mm_navigate({ screen: 'url', url: 'https://metamask.github.io/test-dapp/' })
3. mm_wait_for_notification
4. mm_close_tab({ role: 'notification' })
5. mm_get_state → Verify: notification not in tracked tabs
6. mm_get_state → Verify: active tab is now extension (auto-switched)
7. mm_cleanup
```

---

## 8) Migration Notes

- This is a **behavior change** for `mm_navigate({ screen: 'notification' })` and `mm_wait_for_notification`
- Both now set the notification page as the active page
- Existing workflows that relied on notification replacing current tab need adjustment
- Existing workflows that used `mm_wait_for_notification` but then interacted with extension home will now correctly interact with notification
- The new behavior is more aligned with how real users interact with MetaMask
- New tools `mm_switch_to_tab` and `mm_close_tab` provide explicit control

---

## 9) Example Workflows

### 9.1 Complete dapp connection flow

```
mm_launch({ stateMode: 'default' })
mm_navigate({ screen: 'url', url: 'https://metamask.github.io/test-dapp/' })
mm_describe_screen  # See dapp elements
mm_click({ testId: 'connectButton' })  # Triggers notification
mm_wait_for_notification  # Active page is now notification
mm_describe_screen  # See notification elements (confirm, cancel, etc.)
mm_click({ testId: 'confirm-btn' })  # Confirm on notification
mm_switch_to_tab({ role: 'dapp' })  # Back to dapp
mm_describe_screen  # Verify connected state
mm_cleanup
```

### 9.2 Transaction signing flow

```
mm_launch({ stateMode: 'default' })
mm_navigate({ screen: 'url', url: 'https://metamask.github.io/test-dapp/' })
mm_click({ testId: 'sendButton' })  # Triggers tx notification
mm_wait_for_notification
mm_describe_screen  # See tx details, gas, confirm button
mm_click({ testId: 'confirm-footer-button' })  # Confirm tx
mm_switch_to_tab({ role: 'dapp' })
mm_describe_screen  # Verify tx submitted
mm_cleanup
```

---

## 10) Future Enhancements (Out of Scope)

- Tab-specific screenshots
- Automatic notification page cleanup after confirmation
- Support for multiple dapp tabs
- Tab history tracking
- Page event listeners for automatic active page switching
