# Perps MetaMetrics Event Reference

## Overview

MetaMetrics uses **8 consolidated events** with discriminating properties (vs 38+ Sentry traces). Optimizes Segment costs by grouping similar actions into generic events with type properties.

**Example:** `PERPS_SCREEN_VIEWED` with `screen_type: 'trading' | 'withdrawal' | ...` instead of 9 separate screen events.

## Platform Differentiation

All Perps events **automatically include** platform context via the extension's MetaMetrics system:

| Property           | Value                                                      | Purpose                                  |
| ------------------ | ---------------------------------------------------------- | ---------------------------------------- |
| `app.name`         | `'MetaMask Extension'`                                     | Distinguishes from mobile (`'MetaMask'`) |
| `environment_type` | `'popup' \| 'sidepanel' \| 'fullscreen' \| 'notification'` | UI context                               |
| `page.path`        | `/perps/*`                                                 | Route context                            |

**No manual platform tagging required** - the extension's `MetaMetricsProvider` handles this automatically.

### Querying by Platform (Segment/Mixpanel)

```sql
-- Extension events only
WHERE context.app.name = 'MetaMask Extension'

-- Mobile events only
WHERE context.app.name = 'MetaMask'

-- Extension sidepanel specifically
WHERE context.app.name = 'MetaMask Extension'
  AND properties.environment_type = 'sidepanel'
```

## Two Tracking Approaches

### 1. `usePerpsEventTracking` Hook (Components)

**Location:** `ui/hooks/perps/usePerpsEventTracking.ts`

```typescript
import { useContext, useCallback, useEffect } from 'react';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  PerpsEventProperties,
  PerpsEventValues,
} from '../constants/eventNames';

// Get trackEvent from context
const trackEvent = useContext(MetaMetricsContext);

// Declarative: Track on mount
useEffect(() => {
  if (asset) {
    trackEvent({
      event: MetaMetricsEventName.PerpsScreenViewed,
      category: MetaMetricsEventCategory.Perps,
      properties: {
        screen_type: PerpsEventValues.SCREEN_TYPE.TRADING,
        asset: 'BTC',
      },
    });
  }
}, [asset, trackEvent]);

// Imperative: Track on action
const handleClick = useCallback(() => {
  trackEvent({
    event: MetaMetricsEventName.PerpsUIInteraction,
    category: MetaMetricsEventCategory.Perps,
    properties: {
      interaction_type: PerpsEventValues.INTERACTION_TYPE.CLICK,
      action_type: PerpsEventValues.ACTION_TYPE.START_TRADING,
    },
  });
}, [trackEvent]);
```

### 2. Controller/Background Tracking (Transactions)

**Location:** `app/scripts/controllers/perps/` (when controller is implemented)

```typescript
import { trackMetaMetricsEvent } from '../../../lib/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  PerpsEventProperties,
  PerpsEventValues,
} from '../constants/eventNames';

const startTime = performance.now();

// Track from controller/background
trackMetaMetricsEvent({
  event: MetaMetricsEventName.PerpsTradeTransaction,
  category: MetaMetricsEventCategory.Perps,
  properties: {
    status: PerpsEventValues.STATUS.EXECUTED,
    asset: params.coin,
    order_type: params.orderType,
    completion_duration: performance.now() - startTime,
  },
});
```

## 8 Events

### 1. PERPS_SCREEN_VIEWED

**Properties:**

- `screen_type` (required): `'homescreen' | 'market_list' | 'trading' | 'position_close' | 'leverage' | 'tutorial' | 'withdrawal' | 'tp_sl' | 'create_tpsl' | 'edit_tpsl' | 'asset_details' | 'close_all_positions' | 'cancel_all_orders' | 'order_book' | 'pnl_hero_card' | 'error'`
- `asset` (optional): Asset symbol (e.g., `'BTC'`, `'ETH'`)
- `direction` (optional): `'long' | 'short'`
- `source` (optional): Where user came from (e.g., `'banner'`, `'notification'`, `'main_action_button'`, `'position_tab'`, `'perp_markets'`, `'deeplink'`, `'tutorial'`, `'close_toast'`, `'perp_asset_screen'`)
- `open_position` (optional): Number of open positions (used for close_all_positions screen, number)
- `has_perp_balance` (optional): Whether user has a perps balance or positions (boolean)
- `has_take_profit` (optional): Whether take profit is set (boolean, used for TP/SL screens)
- `has_stop_loss` (optional): Whether stop loss is set (boolean, used for TP/SL screens)
- `pnl_dollar` (optional): P&L in dollars (number, used for pnl_hero_card screen)
- `pnl_percent` (optional): P&L as percentage (number, used for pnl_hero_card screen)
- `button_clicked` (optional): Button that led to this screen (entry point tracking, see [Entry Point Tracking](#entry-point-tracking))
- `button_location` (optional): Location of the button clicked (entry point tracking, see [Entry Point Tracking](#entry-point-tracking))
- `ab_test_button_color` (optional): Button color test variant (`'control' | 'monochrome'`), only included when test is enabled (for baseline exposure tracking)
- Future AB tests: `ab_test_{test_name}` (see [Multiple Concurrent Tests](#multiple-concurrent-tests))

### 2. PERPS_UI_INTERACTION

**Properties:**

- `interaction_type` (required): `'tap' | 'zoom' | 'slide' | 'search_clicked' | 'order_type_viewed' | 'order_type_selected' | 'setting_changed' | 'tutorial_started' | 'tutorial_completed' | 'tutorial_navigation' | 'candle_period_viewed' | 'candle_period_changed' | 'favorite_toggled' | 'button_clicked'` (Note: `favorite_toggled` = watchlist toggle, `button_clicked` = generic button click for entry point tracking)
- `action` (optional): Specific action performed: `'connection_retry' | 'share'`
- `attempt_number` (optional): Retry attempt number when action is 'connection_retry' (number)
- `action_type` (optional): `'start_trading' | 'skip' | 'stop_loss_set' | 'take_profit_set' | 'close_all_positions' | 'cancel_all_orders' | 'learn_more' | 'favorite_market' | 'unfavorite_market'` (Note: `favorite_market` = add to watchlist, `unfavorite_market` = remove from watchlist)
- `asset` (optional): Asset symbol (e.g., `'BTC'`, `'ETH'`)
- `direction` (optional): `'long' | 'short'`
- `order_size` (optional): Size of the order in tokens (number)
- `leverage_used` (optional): Leverage value being used (number)
- `order_type` (optional): `'market' | 'limit'`
- `setting_type` (optional): Type of setting changed (e.g., `'leverage'`)
- `input_method` (optional): How value was entered: `'slider' | 'keyboard' | 'preset' | 'manual' | 'percentage_button'`
- `candle_period` (optional): Selected candle period
- `favorites_count` (optional): Total number of markets in watchlist after toggle (number, used with `favorite_toggled`)
- `button_clicked` (optional): Button identifier for entry point tracking (see [Entry Point Tracking](#entry-point-tracking)): `'deposit' | 'withdraw' | 'tutorial' | 'tooltip' | 'open_position' | 'magnifying_glass' | 'crypto' | 'stocks'`
- `button_location` (optional): Location of the button for entry point tracking (see [Entry Point Tracking](#entry-point-tracking)): `'perps_home' | 'perps_tutorial' | 'perps_home_empty_state' | 'perps_asset_screen' | 'perps_tab' | 'market_list' | 'tooltip'`
- `source` (optional): Source context for favorites (e.g., `'perp_asset_screen'`)
- `ab_test_button_color` (optional): Button color test variant (`'control' | 'monochrome'`), only included when test is enabled and user taps Long/Short or Place Order button (for engagement tracking)
- Future AB tests: `ab_test_{test_name}` (see [Multiple Concurrent Tests](#multiple-concurrent-tests))

### 3. PERPS_TRADE_TRANSACTION

**Properties:**

- `status` (required): `'submitted' | 'executed' | 'partially_filled' | 'failed'`
- `asset` (required): Asset symbol (e.g., `'BTC'`, `'ETH'`)
- `direction` (required): `'long' | 'short'`
- `order_type` (required): `'market' | 'limit'`
- `leverage` (required): Leverage multiplier (number)
- `order_size` (required for executed): Size of the order in tokens (number)
- `asset_price` (required for executed): Price of the asset (number)
- `completion_duration` (required): Duration in milliseconds (number)
- `margin_used` (optional): Margin required/used in USDC (number)
- `metamask_fee` (optional): MetaMask fee amount in USDC (number)
- `metamask_fee_rate` (optional): MetaMask fee rate as decimal (number)
- `discount_percentage` (optional): Fee discount percentage (number)
- `estimated_rewards` (optional): Estimated reward points (number)
- `take_profit_price` (optional): Take profit trigger price (number)
- `stop_loss_price` (optional): Stop loss trigger price (number)
- `input_method` (optional): How value was entered: `'slider' | 'keyboard' | 'preset' | 'manual' | 'percentage_button'`
- `limit_price` (optional): Limit order price (for limit orders) (number)
- `error_message` (optional): Error description when status is 'failed'

### 4. PERPS_POSITION_CLOSE_TRANSACTION

**Properties:**

- `status` (required): `'submitted' | 'executed' | 'partially_filled' | 'failed'`
- `asset` (required): Asset symbol (e.g., `'BTC'`, `'ETH'`)
- `direction` (required): `'long' | 'short'`
- `order_type` (required): `'market' | 'limit'`
- `open_position_size` (required): Size of the open position (number)
- `order_size` (required): Size being closed (number)
- `completion_duration` (required): Duration in milliseconds (number)
- `close_type` (optional): `'full' | 'partial'`
- `percentage_closed` (optional): Percentage of position closed (number)
- `dollar_pnl` (optional): Profit/loss in dollars (number)
- `percent_pnl` (optional): Profit/loss as percentage (number)
- `fee` (optional): Fee paid in USDC (number)
- `received_amount` (optional): Amount received after close (number)
- `input_method` (optional): How value was entered: `'slider' | 'keyboard' | 'preset' | 'manual' | 'percentage_button'`
- `amount_filled` (optional): Amount filled in partially filled orders (number)
- `remaining_amount` (optional): Amount remaining in partially filled orders (number)
- `error_message` (optional): Error description when status is 'failed'

### 5. PERPS_ORDER_CANCEL_TRANSACTION

**Properties:**

- `status` (required): `'submitted' | 'executed' | 'failed'`
- `asset` (required): Asset symbol (e.g., `'BTC'`, `'ETH'`)
- `completion_duration` (required): Duration in milliseconds (number)
- `order_type` (optional): `'market' | 'limit'`
- `error_message` (optional): Error description when status is 'failed'

### 6. PERPS_WITHDRAWAL_TRANSACTION

**Properties:**

- `status` (required): `'submitted' | 'executed' | 'failed'`
- `withdrawal_amount` (required): Amount being withdrawn in USDC (number)
- `completion_duration` (required): Duration in milliseconds (number)
- `error_message` (optional): Error description when status is 'failed'

### 7. PERPS_RISK_MANAGEMENT

**Properties:**

- `status` (required): `'submitted' | 'executed' | 'failed'`
- `asset` (required): Asset symbol (e.g., `'BTC'`, `'ETH'`)
- `completion_duration` (required): Duration in milliseconds (number)
- `take_profit_price` (at least one required): Take profit trigger price (number)
- `stop_loss_price` (at least one required): Stop loss trigger price (number)
- `direction` (optional): `'long' | 'short'`
- `source` (optional): Where TP/SL update originated (e.g., `'tp_sl_view'`, `'position_screen'`)
- `position_size` (optional): Size of the position (number)
- `screen_type` (optional): `'create_tpsl' | 'edit_tpsl'` - Whether creating TP/SL for new order or editing existing position
- `has_take_profit` (optional): Whether take profit is set (boolean)
- `has_stop_loss` (optional): Whether stop loss is set (boolean)
- `take_profit_percentage` (optional): Take profit percentage from entry price (number)
- `stop_loss_percentage` (optional): Stop loss percentage from entry price (number)
- `error_message` (optional): Error description when status is 'failed'

### 8. PERPS_ERROR

**Properties:**

- `error_type` (required for errors): `'network' | 'app_crash' | 'backend' | 'validation'`
- `error_message` (required for errors): Error description string
- `warning_message` (required for warnings): Warning description string
- `screen_type` (optional): Screen where error/warning occurred (e.g., `'trading'`, `'withdrawal'`, `'market_list'`, `'position_close'`)
- `screen_name` (optional): Specific screen name (e.g., `'connection_error'`, `'perps_market_details'`, `'perps_order'`)
- `retry_attempts` (optional): Number of retry attempts (number)
- `asset` (optional): Asset symbol if error is asset-specific (e.g., `'BTC'`, `'ETH'`)
- `action` (optional): Action being attempted when error occurred

**Note:** This event is used for both errors (with `error_type` + `error_message`) and warnings (with `warning_message`).

## Quick Reference

> **Note:** In code, property names and values are accessed via constants (e.g., `PerpsEventProperties.ASSET`, `PerpsEventValues.STATUS.EXECUTED`). The string values shown in the event sections above are what actually gets sent to Segment.

## Adding Events (Extension)

### Screen View

```typescript
import { useContext, useEffect } from 'react';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';

const trackEvent = useContext(MetaMetricsContext);

useEffect(() => {
  trackEvent({
    event: MetaMetricsEventName.PerpsScreenViewed,
    category: MetaMetricsEventCategory.Perps,
    properties: {
      screen_type: 'your_screen',
    },
  });
}, [trackEvent]);
```

### UI Interaction

```typescript
const handleClick = useCallback(() => {
  trackEvent({
    event: MetaMetricsEventName.PerpsUIInteraction,
    category: MetaMetricsEventCategory.Perps,
    properties: {
      interaction_type: 'click', // 'tap' on mobile, 'click' on extension
    },
  });
}, [trackEvent]);
```

### Transaction (Controller)

```typescript
import { trackMetaMetricsEvent } from '../../../lib/metametrics';

trackMetaMetricsEvent({
  event: MetaMetricsEventName.PerpsTradeTransaction,
  category: MetaMetricsEventCategory.Perps,
  properties: {
    status: 'executed',
    completion_duration: duration,
  },
});
```

## Multiple Concurrent Tests

### Flat Property Pattern

To support multiple AB tests running concurrently (e.g., TAT-1937 button colors, TAT-1940 asset CTA, TAT-1827 homepage CTA), we use **flat properties** instead of generic properties.

**Property Naming:** `ab_test_{test_name}` (no `_enabled` suffix needed)

**Why no `_enabled` property?**

- Events are only sent when test is enabled (`isEnabled === true`)
- Including the property means the test is active
- No need for redundant `_enabled` flag

**Example with 3 concurrent tests:**

```typescript
usePerpsEventTracking({
  eventName: MetaMetricsEvents.PERPS_SCREEN_VIEWED,
  properties: {
    [PerpsEventProperties.SCREEN_TYPE]:
      PerpsEventValues.SCREEN_TYPE.ASSET_DETAILS,
    [PerpsEventProperties.ASSET]: 'BTC',
    // Test 1: Button color test (TAT-1937) - only included when enabled
    ...(isButtonColorTestEnabled && {
      [PerpsEventProperties.AB_TEST_BUTTON_COLOR]: buttonColorVariant,
    }),
    // Test 2: Asset CTA test (TAT-1940) - future
    ...(isAssetCTATestEnabled && {
      [PerpsEventProperties.AB_TEST_ASSET_CTA]: assetCTAVariant,
    }),
    // Test 3: Homepage CTA test (TAT-1827) - future
    ...(isHomepageCTATestEnabled && {
      [PerpsEventProperties.AB_TEST_HOMEPAGE_CTA]: homepageCTAVariant,
    }),
  },
});
```

### Where to Track AB Tests

**✅ Track in both events:** Use dual tracking to enable engagement rate calculation.

**Dual Tracking Approach:**

1. **PERPS_SCREEN_VIEWED** (baseline exposure):
   - Include `ab_test_button_color` when test is enabled
   - Establishes how many users were exposed to each variant
   - Required to calculate engagement rate

2. **PERPS_UI_INTERACTION** (engagement):
   - Include `ab_test_button_color` when user taps Long/Short or Place Order button
   - Only sent when test is enabled
   - Measures which variant drives more button presses

**Why Both Events?**

- **Engagement Rate** = Button presses / Screen views per variant
- Answers: "Which button color makes users more likely to press the button?"

**Example:** For TAT-1937 (button color test):

- Screen views establish baseline (how many saw control vs monochrome)
- Button presses measure engagement
- Compare button presses to screen views for each variant

For details, see [perps-ab-testing.md](./perps-ab-testing.md).

---

## PnL Hero Card Tracking

The PnL Hero Card screen is tracked with additional P&L context and source information.

### Properties

- `screen_type`: `'pnl_hero_card'`
- `source`: `'close_toast' | 'perp_asset_screen'` - How user arrived at the screen
- `pnl_dollar`: P&L in dollars (number)
- `pnl_percent`: P&L as percentage (ROE)
- `asset`: Asset symbol (e.g., `'BTC'`)
- `direction`: `'long' | 'short'`

### Source Values

| Value                 | Description                                     |
| --------------------- | ----------------------------------------------- |
| `'close_toast'`       | User tapped on the close position success toast |
| `'perp_asset_screen'` | User navigated from the asset/position screen   |

---

## TP/SL Screen Differentiation

The TP/SL (Take Profit / Stop Loss) tracking differentiates between creating TP/SL for a new order vs editing TP/SL for an existing position.

### Screen Types

| Value           | Description                                             |
| --------------- | ------------------------------------------------------- |
| `'create_tpsl'` | Creating TP/SL for a new order (before order placement) |
| `'edit_tpsl'`   | Editing TP/SL for an existing position                  |

### Additional Properties

- `has_take_profit`: Whether take profit is currently set (boolean)
- `has_stop_loss`: Whether stop loss is currently set (boolean)
- `take_profit_percentage`: Take profit percentage from entry price
- `stop_loss_percentage`: Stop loss percentage from entry price

### Usage

```typescript
// Screen view tracking
usePerpsEventTracking({
  eventName: MetaMetricsEvents.PERPS_SCREEN_VIEWED,
  properties: {
    [PerpsEventProperties.SCREEN_TYPE]: isEditingExistingPosition
      ? PerpsEventValues.SCREEN_TYPE.EDIT_TPSL
      : PerpsEventValues.SCREEN_TYPE.CREATE_TPSL,
    [PerpsEventProperties.ASSET]: asset,
    [PerpsEventProperties.HAS_TAKE_PROFIT]: !!initialTakeProfitPrice,
    [PerpsEventProperties.HAS_STOP_LOSS]: !!initialStopLossPrice,
  },
});
```

---

## Entry Point Tracking

Entry point tracking captures how users navigate to screens, enabling analysis of user flows and button effectiveness.

### Properties

- `button_clicked`: Identifies which button was clicked
- `button_location`: Identifies where the button was located

### Button Clicked Values

| Value                | Description                             |
| -------------------- | --------------------------------------- |
| `'deposit'`          | Add funds / deposit button              |
| `'withdraw'`         | Withdraw funds button                   |
| `'tutorial'`         | Learn more / tutorial button            |
| `'tooltip'`          | Got it button in tooltip bottom sheets  |
| `'open_position'`    | Tap on a position card                  |
| `'magnifying_glass'` | Search icon button                      |
| `'crypto'`           | Crypto tab in market list               |
| `'stocks'`           | Stocks & Commodities tab in market list |

### Button Location Values

| Value                      | Description                         |
| -------------------------- | ----------------------------------- |
| `'perps_home'`             | Perps home screen                   |
| `'perps_tutorial'`         | Tutorial screen                     |
| `'perps_home_empty_state'` | Perps home empty state (no balance) |
| `'perps_asset_screen'`     | Asset details screen                |
| `'perps_tab'`              | Positions tab                       |
| `'market_list'`            | Market list screen                  |
| `'tooltip'`                | Tooltip bottom sheet                |

### Usage Example

```typescript
// Track button click
track(MetaMetricsEvents.PERPS_UI_INTERACTION, {
  [PerpsEventProperties.INTERACTION_TYPE]:
    PerpsEventValues.INTERACTION_TYPE.BUTTON_CLICKED,
  [PerpsEventProperties.BUTTON_CLICKED]:
    PerpsEventValues.BUTTON_CLICKED.DEPOSIT,
  [PerpsEventProperties.BUTTON_LOCATION]:
    PerpsEventValues.BUTTON_LOCATION.PERPS_HOME,
});

// Pass to navigation for screen view tracking
navigation.navigate(Routes.PERPS.MARKET_LIST, {
  button_clicked: PerpsEventValues.BUTTON_CLICKED.MAGNIFYING_GLASS,
  button_location: PerpsEventValues.BUTTON_LOCATION.PERPS_HOME,
});

// Include in screen view event
usePerpsEventTracking({
  eventName: MetaMetricsEvents.PERPS_SCREEN_VIEWED,
  properties: {
    [PerpsEventProperties.SCREEN_TYPE]:
      PerpsEventValues.SCREEN_TYPE.MARKET_LIST,
    ...(buttonClicked && {
      [PerpsEventProperties.BUTTON_CLICKED]: buttonClicked,
    }),
    ...(buttonLocation && {
      [PerpsEventProperties.BUTTON_LOCATION]: buttonLocation,
    }),
  },
});
```

---

## Best Practices

1. **Use constants** - Never hardcode strings
2. **Track status** - Always include success/failure
3. **Track duration** - Include `completion_duration` for transactions
4. **Use properties** - Don't create new events for minor variations
5. **Auto timestamp** - `usePerpsEventTracking` adds it automatically
6. **AB test tracking** - Only in screen view events, not every interaction
7. **Entry point tracking** - Include `button_clicked` and `button_location` to track user navigation flows

## Sentry vs MetaMetrics

| Sentry                | MetaMetrics             |
| --------------------- | ----------------------- |
| 38+ traces            | 8 events                |
| Performance           | Behavior                |
| Technical metrics     | Business metrics        |
| `usePerpsMeasurement` | `usePerpsEventTracking` |

## Extension-Specific Considerations

### Interaction Types

| Mobile  | Extension                 | Notes              |
| ------- | ------------------------- | ------------------ |
| `tap`   | `click`                   | User input action  |
| `slide` | `drag` or `slider_change` | Slider interaction |
| `zoom`  | `zoom`                    | Chart zoom (same)  |

### Environment Type in Events

The extension automatically includes `environment_type` in the event context. Use this for A/B testing different experiences:

```typescript
// Events from sidepanel users
properties.environment_type === 'sidepanel';

// Events from popup users
properties.environment_type === 'popup';
```

### Page Context

Extension events include page context automatically:

```typescript
// Automatically added by MetaMetricsProvider
context.page = {
  path: '/perps/market/BTC',
  title: 'Perps Market',
  url: '/perps/market/BTC',
};
```

## Related Files

- **MetaMetrics Context**: `ui/contexts/metametrics.js`
- **Event Constants**: `shared/constants/metametrics.ts`
- **Segment Context Hook**: `ui/hooks/useSegmentContext.js`
- **Properties & Values**: `ui/hooks/perps/constants/eventNames.ts` (to be created)
- **Controller**: `app/scripts/controllers/perps/` (to be implemented)
