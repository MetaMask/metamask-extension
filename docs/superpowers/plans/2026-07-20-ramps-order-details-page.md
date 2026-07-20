# Ramps Order Details Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the extension ramps order details page (`/ramps/order-details/:orderId`) that renders a persisted buy order in completed, pending, or error state.

**Architecture:** A pure rendering page keyed off Redux order state via `useRampsOrders().getOrderById`. A container (`order-details.tsx`) resolves the order from the route param, selects the state, and owns the header + Done/Close navigation + error retry (`refreshOrder`). A presentational child (`order-content.tsx`) lays out the fields for a resolved order and handles copy-order-id + view-on-provider + pending styling. No tab watching, no callback resolution, no polling — those live in TRAM-3717 / TRAM-3719.

**Tech Stack:** React + TypeScript, `@metamask/design-system-react` components, `react-router-dom` v6 (`useParams`/`useNavigate`), `@metamask/ramps-controller` types, Jest + `@testing-library/react`.

## Global Constraints

- Order data comes only from `useRampsOrders` (`ui/hooks/ramps/useRampsOrders.ts`); the page never fetches except the retry path (`refreshOrder`).
- Reuse existing helpers — do not reimplement: `formatDate` (`ui/helpers/utils/util.js`), `formatCurrency` (`ui/helpers/utils/confirm-tx.util.ts`), `useCopyToClipboard` (`ui/hooks/useCopyToClipboard.ts`), `RampsSelectionPage` (`ui/pages/ramps/components/ramps-selection-page.tsx`).
- Order type + status enum from `@metamask/ramps-controller`: `RampsOrder`, `RampsOrderStatus`, `normalizeProviderCode`.
- New user-facing strings go in `app/_locales/en/messages.json` (English base locale only; keys inserted in alphabetical order — the repo lints ordering).
- Tests render via `renderWithProvider` from `test/lib/render-helpers-navigate` and read i18n via `enLocale as messages` from `test/lib/i18n-helpers`, mirroring `ui/pages/ramps/token-selection/token-selection.test.tsx`.
- Wallet overview route is `DEFAULT_ROUTE = '/'` from `ui/helpers/constants/routes.ts`.
- Commit after each task with a `feat:`/`test:` conventional message.

---

## File Structure

- Create `ui/pages/ramps/order-details/order-details.tsx` — container (resolve order, pick state, header, Done/Close, retry).
- Create `ui/pages/ramps/order-details/order-details.test.tsx` — container tests + snapshots.
- Create `ui/pages/ramps/order-details/index.ts` — default re-export (lazy import target).
- Create `ui/pages/ramps/order-details/components/order-content.tsx` — resolved-order field layout.
- Create `ui/pages/ramps/order-details/components/order-content.test.tsx` — content tests + snapshots.
- Modify `ui/helpers/constants/routes.ts` — add `RAMPS_ORDER_DETAILS_ROUTE`.
- Modify `ui/pages/routes/routes.component.tsx` — lazy import + route element.
- Modify `app/_locales/en/messages.json` — new strings.

---

## Task 1: Route wiring + container skeleton (order-not-found state + Done/Close nav)

**Files:**
- Create: `ui/pages/ramps/order-details/order-details.tsx`
- Create: `ui/pages/ramps/order-details/index.ts`
- Create: `ui/pages/ramps/order-details/order-details.test.tsx`
- Modify: `ui/helpers/constants/routes.ts` (after line 187, the `RAMPS_PAYMENT_METHOD_ROUTE` block)
- Modify: `ui/pages/routes/routes.component.tsx` (lazy import near line 206; route element near line 549)
- Modify: `app/_locales/en/messages.json`

**Interfaces:**
- Consumes: `useRampsOrders(): { getOrderById(id): RampsOrder | undefined; refreshOrder(providerCode, orderCode, wallet): Promise<RampsOrder> }` from `ui/hooks/ramps/useRampsOrders.ts`; `RampsSelectionPage`; `DEFAULT_ROUTE`.
- Produces: default export `RampsOrderDetailsScreen` (React component); route constant `RAMPS_ORDER_DETAILS_ROUTE = '/ramps/order-details/:orderId'`; testids `ramps-order-details-screen`, `ramps-order-details-not-found`, `ramps-order-details-done`.

- [ ] **Step 1: Add the route constant**

In `ui/helpers/constants/routes.ts`, after the `RAMPS_PAYMENT_METHOD_ROUTE` line (187):

```ts
export const RAMPS_ORDER_DETAILS_ROUTE = '/ramps/order-details/:orderId';
```

- [ ] **Step 2: Add i18n strings**

In `app/_locales/en/messages.json`, add these keys in their correct alphabetical positions (each value is an object `{ "message": "..." }`):

```json
"rampsOrderDetailsDone": { "message": "Done" },
"rampsOrderDetailsNotFound": { "message": "Order not found" },
"rampsOrderDetailsTitle": { "message": "Order details" }
```

- [ ] **Step 3: Write the failing container test**

Create `ui/pages/ramps/order-details/order-details.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { RampsOrderDetailsScreen } from './order-details';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ orderId: 'order-1' }),
}));

jest.mock('../../../hooks/ramps/useRampsOrders', () => ({
  useRampsOrders: jest.fn(),
}));

const { useRampsOrders } = jest.requireMock(
  '../../../hooks/ramps/useRampsOrders',
);

const createStore = () => configureStore({ metamask: {} });

describe('RampsOrderDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRampsOrders.mockReturnValue({
      getOrderById: jest.fn().mockReturnValue(undefined),
      refreshOrder: jest.fn(),
    });
  });

  it('renders the not-found state when the order is missing', () => {
    renderWithProvider(
      <RampsOrderDetailsScreen />,
      createStore(),
      '/ramps/order-details/order-1',
    );

    expect(
      screen.getByTestId('ramps-order-details-not-found'),
    ).toBeInTheDocument();
  });

  it('navigates to wallet overview when Done is clicked', () => {
    renderWithProvider(
      <RampsOrderDetailsScreen />,
      createStore(),
      '/ramps/order-details/order-1',
    );

    fireEvent.click(screen.getByTestId('ramps-order-details-done'));
    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `yarn jest ui/pages/ramps/order-details/order-details.test.tsx`
Expected: FAIL — cannot resolve `./order-details`.

- [ ] **Step 5: Implement the container skeleton**

Create `ui/pages/ramps/order-details/order-details.tsx`:

```tsx
import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsOrders } from '../../../hooks/ramps/useRampsOrders';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  RampsSelectionCenteredMessage,
  RampsSelectionPage,
} from '../components/ramps-selection-page';

export function RampsOrderDetailsScreen() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrderById } = useRampsOrders();

  const order = orderId ? getOrderById(orderId) : undefined;

  const goToWalletOverview = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  if (!order) {
    return (
      <RampsSelectionPage
        title={t('rampsOrderDetailsTitle')}
        onBack={goToWalletOverview}
        testId="ramps-order-details-not-found"
        backButtonTestId="ramps-order-details-back"
      >
        <RampsSelectionCenteredMessage
          message={t('rampsOrderDetailsNotFound')}
        />
        <Box
          className="border-t border-border-muted px-4 py-3"
          flexDirection={BoxFlexDirection.Column}
        >
          <Button
            variant={ButtonVariant.Primary}
            onClick={goToWalletOverview}
            data-testid="ramps-order-details-done"
            isFullWidth
          >
            {t('rampsOrderDetailsDone')}
          </Button>
        </Box>
      </RampsSelectionPage>
    );
  }

  // Resolved-order rendering is added in Task 2.
  return (
    <RampsSelectionPage
      title={t('rampsOrderDetailsTitle')}
      onBack={goToWalletOverview}
      testId="ramps-order-details-screen"
      backButtonTestId="ramps-order-details-back"
    >
      <Box
        className="border-t border-border-muted px-4 py-3"
        flexDirection={BoxFlexDirection.Column}
      >
        <Button
          variant={ButtonVariant.Primary}
          onClick={goToWalletOverview}
          data-testid="ramps-order-details-done"
          isFullWidth
        >
          {t('rampsOrderDetailsDone')}
        </Button>
      </Box>
    </RampsSelectionPage>
  );
}

export default RampsOrderDetailsScreen;
```

Create `ui/pages/ramps/order-details/index.ts`:

```ts
export { default } from './order-details';
```

> Note: confirm the `Button`/`ButtonVariant`/`isFullWidth` names against `@metamask/design-system-react` (grep an existing usage, e.g. `grep -rn "ButtonVariant" ui/pages/ramps ui/components/multichain | head`). If the design-system button uses different prop names, match them; the testids and behavior are what matter.

- [ ] **Step 6: Run the test to verify it passes**

Run: `yarn jest ui/pages/ramps/order-details/order-details.test.tsx`
Expected: PASS (both tests).

- [ ] **Step 7: Register the route**

In `ui/pages/routes/routes.component.tsx`:

Add the lazy import near the other ramps imports (~line 206):

```tsx
const RampsOrderDetails = mmLazy(
  () => import('../ramps/order-details/index.ts'),
);
```

Add the import of the constant to the existing routes-constants import block (near lines 48-50):

```tsx
  RAMPS_ORDER_DETAILS_ROUTE,
```

Add the route element next to the other ramps routes (~line 549, after the `RAMPS_PAYMENT_METHOD_ROUTE` block):

```tsx
          {
            path: RAMPS_ORDER_DETAILS_ROUTE,
            element: <RampsOrderDetails />,
          },
```

- [ ] **Step 8: Typecheck and lint the touched files**

Run: `yarn tsc --noEmit 2>&1 | grep -i "order-details\|routes.component\|routes.ts" || echo "no type errors in touched files"`
Expected: no errors in touched files.

- [ ] **Step 9: Commit**

```bash
git add ui/pages/ramps/order-details ui/helpers/constants/routes.ts ui/pages/routes/routes.component.tsx app/_locales/en/messages.json
git commit -m "feat(ramps): add order details route and container skeleton"
```

---

## Task 2: OrderContent — completed/terminal fields (token, amount, status, copyable order ID, view-on-provider, date, fees, total)

**Files:**
- Create: `ui/pages/ramps/order-details/components/order-content.tsx`
- Create: `ui/pages/ramps/order-details/components/order-content.test.tsx`
- Modify: `ui/pages/ramps/order-details/order-details.tsx` (render `OrderContent` in the resolved-order branch)
- Modify: `app/_locales/en/messages.json`

**Interfaces:**
- Consumes: `RampsOrder`, `RampsOrderStatus` from `@metamask/ramps-controller`; `formatDate` from `ui/helpers/utils/util.js`; `formatCurrency` from `ui/helpers/utils/confirm-tx.util.ts`; `useCopyToClipboard` from `ui/hooks/useCopyToClipboard.ts`.
- Produces: `OrderContent` component `({ order: RampsOrder }) => JSX`; testids `ramps-order-content`, `ramps-order-details-token-amount`, `ramps-order-details-status`, `ramps-order-details-view-on-provider`, `ramps-order-details-order-id`, `ramps-order-details-date`, `ramps-order-details-fees`, `ramps-order-details-total`.

- [ ] **Step 1: Add i18n strings**

In `app/_locales/en/messages.json`, add (alphabetical positions):

```json
"rampsOrderDetailsDateAndTime": { "message": "Date and time" },
"rampsOrderDetailsFees": { "message": "Fees" },
"rampsOrderDetailsOrderId": { "message": "Order ID" },
"rampsOrderDetailsStatus": { "message": "Status" },
"rampsOrderDetailsTotal": { "message": "Total" },
"rampsOrderDetailsViewOnProvider": { "message": "View on $1" }
```

(`$1` is substituted with the provider name via `t('rampsOrderDetailsViewOnProvider', [providerName])`.)

- [ ] **Step 2: Write the failing content test**

Create `ui/pages/ramps/order-details/components/order-content.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { RampsOrderStatus, type RampsOrder } from '@metamask/ramps-controller';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import copyToClipboard from 'copy-to-clipboard';
import { OrderContent } from './order-content';

jest.mock('copy-to-clipboard', () => jest.fn());

const completedOrder = {
  providerOrderId: 'provider-order-1234567890',
  providerOrderLink: 'https://provider.example/order/1',
  status: RampsOrderStatus.Completed,
  createdAt: 1_700_000_000_000,
  cryptoAmount: '0.5',
  fiatAmount: 1000,
  totalFeesFiat: 12.5,
  cryptoCurrency: { symbol: 'ETH', iconUrl: 'https://x/eth.png', decimals: 18, chainId: 'eip155:1' },
  fiatCurrency: { symbol: 'USD', decimals: 2 },
  network: { name: 'Ethereum', chainId: 'eip155:1' },
  provider: { id: 'transak', name: 'Transak' },
  walletAddress: '0xabc',
} as unknown as RampsOrder;

const renderContent = (order: RampsOrder) =>
  renderWithProvider(
    <OrderContent order={order} />,
    configureStore({ metamask: {} }),
  );

describe('OrderContent (completed)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the crypto amount and symbol', () => {
    renderContent(completedOrder);
    expect(
      screen.getByTestId('ramps-order-details-token-amount'),
    ).toHaveTextContent('0.5 ETH');
  });

  it('renders the fees and total formatted as currency', () => {
    renderContent(completedOrder);
    expect(screen.getByTestId('ramps-order-details-fees')).toHaveTextContent(
      '$12.50',
    );
    expect(screen.getByTestId('ramps-order-details-total')).toHaveTextContent(
      '$1,000.00',
    );
  });

  it('renders the view-on-provider link when providerOrderLink is set', () => {
    renderContent(completedOrder);
    expect(
      screen.getByTestId('ramps-order-details-view-on-provider'),
    ).toBeInTheDocument();
  });

  it('hides the view-on-provider link when providerOrderLink is empty', () => {
    renderContent({ ...completedOrder, providerOrderLink: '' } as RampsOrder);
    expect(
      screen.queryByTestId('ramps-order-details-view-on-provider'),
    ).not.toBeInTheDocument();
  });

  it('copies the full order id when the order id is clicked', () => {
    renderContent(completedOrder);
    fireEvent.click(screen.getByTestId('ramps-order-details-order-id'));
    expect(copyToClipboard).toHaveBeenCalledWith(
      'provider-order-1234567890',
      expect.anything(),
    );
  });

  it('matches the completed snapshot', () => {
    const { container } = renderContent(completedOrder);
    expect(container).toMatchSnapshot();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `yarn jest ui/pages/ramps/order-details/components/order-content.test.tsx`
Expected: FAIL — cannot resolve `./order-content`.

- [ ] **Step 4: Implement OrderContent**

Create `ui/pages/ramps/order-details/components/order-content.tsx`:

```tsx
import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { RampsOrderStatus, type RampsOrder } from '@metamask/ramps-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { formatDate } from '../../../../helpers/utils/util';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';

const PENDING_STATUSES = new Set<RampsOrderStatus>([
  RampsOrderStatus.Pending,
  RampsOrderStatus.Created,
  RampsOrderStatus.Precreated,
  RampsOrderStatus.Unknown,
]);

const FAILED_STATUSES = new Set<RampsOrderStatus>([
  RampsOrderStatus.Failed,
  RampsOrderStatus.Cancelled,
  RampsOrderStatus.IdExpired,
]);

function getStatusColor(status: RampsOrderStatus): TextColor {
  if (status === RampsOrderStatus.Completed) {
    return TextColor.SuccessDefault;
  }
  if (FAILED_STATUSES.has(status)) {
    return TextColor.ErrorDefault;
  }
  return TextColor.WarningDefault;
}

function shortenOrderId(id: string): string {
  return id.length > 8 ? `...${id.slice(-6)}` : id;
}

type OrderRowProps = { label: string; children: React.ReactNode };

function OrderRow({ label, children }: OrderRowProps) {
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      className="py-3"
    >
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {label}
      </Text>
      {children}
    </Box>
  );
}

export function OrderContent({ order }: { order: RampsOrder }) {
  const t = useI18nContext();
  const [, handleCopy] = useCopyToClipboard({ clearDelayMs: null });

  const isPending = PENDING_STATUSES.has(order.status);
  const fiatSymbol = order.fiatCurrency?.symbol ?? 'USD';
  const fiatDecimals = order.fiatCurrency?.decimals ?? 2;

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="flex-1 overflow-y-auto px-4"
      data-testid="ramps-order-content"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        className="py-6"
      >
        <Text
          variant={TextVariant.DisplayMd}
          data-testid="ramps-order-details-token-amount"
        >
          {isPending && !order.cryptoAmount
            ? '...'
            : `${order.cryptoAmount} ${order.cryptoCurrency?.symbol ?? ''}`}
        </Text>
      </Box>

      <OrderRow label={t('rampsOrderDetailsStatus')}>
        <Box flexDirection={BoxFlexDirection.Column} alignItems={BoxAlignItems.End}>
          <Text
            variant={TextVariant.BodyMd}
            color={getStatusColor(order.status)}
            data-testid="ramps-order-details-status"
          >
            {order.status}
          </Text>
          {order.providerOrderLink ? (
            <a
              href={order.providerOrderLink}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="ramps-order-details-view-on-provider"
            >
              <Text variant={TextVariant.BodySm} color={TextColor.PrimaryDefault}>
                {t('rampsOrderDetailsViewOnProvider', [
                  order.provider?.name ?? '',
                ])}
              </Text>
            </a>
          ) : null}
        </Box>
      </OrderRow>

      <OrderRow label={t('rampsOrderDetailsOrderId')}>
        <button
          type="button"
          onClick={() => handleCopy(order.providerOrderId)}
          data-testid="ramps-order-details-order-id"
          className="flex items-center gap-1"
        >
          <Text variant={TextVariant.BodyMd}>
            {shortenOrderId(order.providerOrderId)}
          </Text>
          <Icon name={IconName.Copy} size={IconSize.Sm} />
        </button>
      </OrderRow>

      <OrderRow label={t('rampsOrderDetailsDateAndTime')}>
        <Text variant={TextVariant.BodyMd} data-testid="ramps-order-details-date">
          {formatDate(order.createdAt)}
        </Text>
      </OrderRow>

      <OrderRow label={t('rampsOrderDetailsFees')}>
        <Text variant={TextVariant.BodyMd} data-testid="ramps-order-details-fees">
          {formatCurrency(String(order.totalFeesFiat), fiatSymbol, fiatDecimals)}
        </Text>
      </OrderRow>

      <OrderRow label={t('rampsOrderDetailsTotal')}>
        <Text variant={TextVariant.BodyMd} data-testid="ramps-order-details-total">
          {formatCurrency(String(order.fiatAmount), fiatSymbol, fiatDecimals)}
        </Text>
      </OrderRow>
    </Box>
  );
}

export default OrderContent;
```

> Note: verify the design-system exports actually used (`Icon`, `IconName`, `IconSize`, `TextColor.SuccessDefault/WarningDefault/ErrorDefault/PrimaryDefault`, `TextVariant.DisplayMd`) with `grep -rn "TextColor.SuccessDefault\|IconName.Copy\|TextVariant.DisplayMd" ui | head`. If a token name differs, use the repo's actual name; keep the testids and formatting logic.

- [ ] **Step 5: Run the test to verify it passes**

Run: `yarn jest ui/pages/ramps/order-details/components/order-content.test.tsx`
Expected: PASS. If the `$12.50` / `$1,000.00` assertions differ from `formatCurrency`'s actual output, update the expected strings to match the real formatter output (run once, read the failure, correct the literals — the formatter is the source of truth, not the test).

- [ ] **Step 6: Wire OrderContent into the container**

In `ui/pages/ramps/order-details/order-details.tsx`, replace the resolved-order return branch's placeholder body so it renders `OrderContent` above the Done button. Add the import:

```tsx
import OrderContent from './components/order-content';
```

Resolved-order branch:

```tsx
  return (
    <RampsSelectionPage
      title={t('rampsOrderDetailsTitle')}
      onBack={goToWalletOverview}
      testId="ramps-order-details-screen"
      backButtonTestId="ramps-order-details-back"
    >
      <OrderContent order={order} />
      <Box
        className="border-t border-border-muted px-4 py-3"
        flexDirection={BoxFlexDirection.Column}
      >
        <Button
          variant={ButtonVariant.Primary}
          onClick={goToWalletOverview}
          data-testid="ramps-order-details-done"
          isFullWidth
        >
          {t('rampsOrderDetailsDone')}
        </Button>
      </Box>
    </RampsSelectionPage>
  );
```

- [ ] **Step 7: Add a container test for the completed state**

Append to `ui/pages/ramps/order-details/order-details.test.tsx` (inside the describe), and add a `completedOrder` fixture at the top of the file matching the one in the content test:

```tsx
  it('renders order content and the completed snapshot when an order exists', () => {
    useRampsOrders.mockReturnValue({
      getOrderById: jest.fn().mockReturnValue(completedOrder),
      refreshOrder: jest.fn(),
    });

    const { container } = renderWithProvider(
      <RampsOrderDetailsScreen />,
      createStore(),
      '/ramps/order-details/order-1',
    );

    expect(screen.getByTestId('ramps-order-content')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
```

Add near the imports of that file:

```tsx
import { RampsOrderStatus, type RampsOrder } from '@metamask/ramps-controller';

const completedOrder = {
  providerOrderId: 'provider-order-1234567890',
  providerOrderLink: 'https://provider.example/order/1',
  status: RampsOrderStatus.Completed,
  createdAt: 1_700_000_000_000,
  cryptoAmount: '0.5',
  fiatAmount: 1000,
  totalFeesFiat: 12.5,
  cryptoCurrency: { symbol: 'ETH', iconUrl: 'https://x/eth.png', decimals: 18, chainId: 'eip155:1' },
  fiatCurrency: { symbol: 'USD', decimals: 2 },
  network: { name: 'Ethereum', chainId: 'eip155:1' },
  provider: { id: 'transak', name: 'Transak' },
  walletAddress: '0xabc',
} as unknown as RampsOrder;
```

- [ ] **Step 8: Run both test files**

Run: `yarn jest ui/pages/ramps/order-details`
Expected: PASS (all tests in both files).

- [ ] **Step 9: Commit**

```bash
git add ui/pages/ramps/order-details app/_locales/en/messages.json
git commit -m "feat(ramps): render completed order details content"
```

---

## Task 3: Pending state (warning styling + "may take time" message + amount skeletons)

**Files:**
- Modify: `ui/pages/ramps/order-details/components/order-content.tsx`
- Modify: `ui/pages/ramps/order-details/components/order-content.test.tsx`
- Modify: `app/_locales/en/messages.json`

**Interfaces:**
- Consumes: existing `OrderContent`, `PENDING_STATUSES`, `getStatusColor`.
- Produces: pending message testid `ramps-order-details-pending-message`; skeleton testid `ramps-order-details-amount-skeleton`.

- [ ] **Step 1: Add the pending message string**

In `app/_locales/en/messages.json`:

```json
"rampsOrderDetailsPendingMessage": { "message": "Your order may take some time to confirm." }
```

- [ ] **Step 2: Write failing pending tests**

Append to `ui/pages/ramps/order-details/components/order-content.test.tsx`:

```tsx
describe('OrderContent (pending)', () => {
  const pendingOrder = {
    ...completedOrder,
    status: RampsOrderStatus.Pending,
    cryptoAmount: '',
  } as unknown as RampsOrder;

  it('shows the pending message', () => {
    renderContent(pendingOrder);
    expect(
      screen.getByTestId('ramps-order-details-pending-message'),
    ).toHaveTextContent('Your order may take some time to confirm.');
  });

  it('shows an amount skeleton while the crypto amount is unresolved', () => {
    renderContent(pendingOrder);
    expect(
      screen.getByTestId('ramps-order-details-amount-skeleton'),
    ).toBeInTheDocument();
  });

  it('matches the pending snapshot', () => {
    const { container } = renderContent(pendingOrder);
    expect(container).toMatchSnapshot();
  });
});
```

The `completedOrder` fixture already exists at the top of this file from Task 2; reuse it. If `RampsOrderStatus` is not already imported in this file, it was added in Task 2 — confirm the import is present.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `yarn jest ui/pages/ramps/order-details/components/order-content.test.tsx -t pending`
Expected: FAIL — no pending message / skeleton testids.

- [ ] **Step 4: Implement pending rendering**

In `order-content.tsx`, replace the token-amount block so it renders a skeleton when pending and the amount is unresolved, and add the pending message under the amount:

```tsx
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        className="py-6"
      >
        {isPending && !order.cryptoAmount ? (
          <Box
            className="h-[24px] w-[120px] rounded bg-background-muted"
            data-testid="ramps-order-details-amount-skeleton"
          />
        ) : (
          <Text
            variant={TextVariant.DisplayMd}
            data-testid="ramps-order-details-token-amount"
          >
            {`${order.cryptoAmount} ${order.cryptoCurrency?.symbol ?? ''}`}
          </Text>
        )}
        {isPending ? (
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            data-testid="ramps-order-details-pending-message"
            className="mt-2 text-center"
          >
            {t('rampsOrderDetailsPendingMessage')}
          </Text>
        ) : null}
      </Box>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn jest ui/pages/ramps/order-details/components/order-content.test.tsx`
Expected: PASS (completed + pending groups).

- [ ] **Step 6: Commit**

```bash
git add ui/pages/ramps/order-details app/_locales/en/messages.json
git commit -m "feat(ramps): render pending order state with skeleton and message"
```

---

## Task 4: Error state + retry (refreshOrder)

**Files:**
- Modify: `ui/pages/ramps/order-details/order-details.tsx`
- Modify: `ui/pages/ramps/order-details/order-details.test.tsx`
- Modify: `app/_locales/en/messages.json`

**Interfaces:**
- Consumes: `useRampsOrders().refreshOrder(providerCode, orderCode, wallet)`; `normalizeProviderCode` from `@metamask/ramps-controller`.
- Produces: error state testid `ramps-order-details-error`; retry button testid `ramps-order-details-retry`.

**Design note:** The error state covers two cases — (a) order not found (Task 1's not-found branch is folded into this error state), and (b) a retry `refreshOrder` threw. Retry is only meaningful when we have enough to call `refreshOrder`. When there is no order at all, retry re-attempts nothing resolvable, so in the not-found case the retry button navigates to wallet overview instead. When an order exists but a prior refresh failed, retry re-calls `refreshOrder`.

- [ ] **Step 1: Add error/retry strings**

In `app/_locales/en/messages.json`:

```json
"rampsOrderDetailsError": { "message": "We couldn't load your order details." },
"rampsOrderDetailsRetry": { "message": "Try again" }
```

- [ ] **Step 2: Write failing retry tests**

Append to `ui/pages/ramps/order-details/order-details.test.tsx`:

```tsx
  it('calls refreshOrder when retry is clicked for an existing order', async () => {
    const refreshOrder = jest.fn().mockResolvedValue(completedOrder);
    useRampsOrders.mockReturnValue({
      getOrderById: jest.fn().mockReturnValue({
        ...completedOrder,
        status: RampsOrderStatus.Pending,
      }),
      refreshOrder,
    });

    renderWithProvider(
      <RampsOrderDetailsScreen />,
      createStore(),
      '/ramps/order-details/order-1',
    );

    fireEvent.click(screen.getByTestId('ramps-order-details-refresh'));

    expect(refreshOrder).toHaveBeenCalledWith(
      'transak',
      'provider-order-1234567890',
      '0xabc',
    );
  });

  it('shows the error state when refreshOrder throws', async () => {
    const refreshOrder = jest.fn().mockRejectedValue(new Error('boom'));
    useRampsOrders.mockReturnValue({
      getOrderById: jest.fn().mockReturnValue({
        ...completedOrder,
        status: RampsOrderStatus.Pending,
      }),
      refreshOrder,
    });

    renderWithProvider(
      <RampsOrderDetailsScreen />,
      createStore(),
      '/ramps/order-details/order-1',
    );

    fireEvent.click(screen.getByTestId('ramps-order-details-refresh'));

    expect(
      await screen.findByTestId('ramps-order-details-error'),
    ).toBeInTheDocument();
  });
```

Add a refresh affordance expectation to the existing completed-state test is not required; the refresh button (`ramps-order-details-refresh`) is added to the resolved-order branch in Step 4.

- [ ] **Step 3: Run to verify failure**

Run: `yarn jest ui/pages/ramps/order-details/order-details.test.tsx -t retry`
Expected: FAIL — no `ramps-order-details-refresh` / error testids yet.

- [ ] **Step 4: Implement error state + retry**

In `order-details.tsx`:

Add imports and state:

```tsx
import React, { useCallback, useState } from 'react';
import {
  normalizeProviderCode,
} from '@metamask/ramps-controller';
```

Inside the component, after `const order = ...`:

```tsx
  const { getOrderById, refreshOrder } = useRampsOrders();
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    if (!order) {
      return;
    }
    try {
      setError(null);
      await refreshOrder(
        normalizeProviderCode(order.provider?.id ?? ''),
        order.providerOrderId,
        order.walletAddress,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [order, refreshOrder]);
```

Replace the `!order` branch and add an error branch. Both use a shared error view; the retry action differs (not-found → wallet overview, refresh error → `handleRefresh`):

```tsx
  if (!order || error) {
    const onRetry = order ? handleRefresh : goToWalletOverview;
    return (
      <RampsSelectionPage
        title={t('rampsOrderDetailsTitle')}
        onBack={goToWalletOverview}
        testId="ramps-order-details-error"
        backButtonTestId="ramps-order-details-back"
      >
        <RampsSelectionCenteredMessage
          message={order ? t('rampsOrderDetailsError') : t('rampsOrderDetailsNotFound')}
        />
        <Box
          className="border-t border-border-muted px-4 py-3"
          flexDirection={BoxFlexDirection.Column}
        >
          <Button
            variant={ButtonVariant.Primary}
            onClick={onRetry}
            data-testid={order ? 'ramps-order-details-retry' : 'ramps-order-details-done'}
            isFullWidth
          >
            {order ? t('rampsOrderDetailsRetry') : t('rampsOrderDetailsDone')}
          </Button>
        </Box>
      </RampsSelectionPage>
    );
  }
```

In the resolved-order branch, add a refresh control near the Done button so pending orders can be refreshed:

```tsx
        <Button
          variant={ButtonVariant.Secondary}
          onClick={handleRefresh}
          data-testid="ramps-order-details-refresh"
          isFullWidth
        >
          {t('rampsOrderDetailsRetry')}
        </Button>
```

> Note: the not-found test from Task 1 still passes — the not-found branch now lives inside `if (!order || error)` and keeps testid `ramps-order-details-done` on its button (retry navigates to wallet overview when there is no order). Confirm the Task 1 not-found test still asserts `ramps-order-details-not-found`; if the testid moved to `ramps-order-details-error`, update that Task 1 assertion to `ramps-order-details-error`. Keep one testid; do not leave both.

- [ ] **Step 5: Reconcile the Task 1 not-found test**

Update the Task 1 not-found test assertion to the merged error/not-found testid:

```tsx
    expect(
      screen.getByTestId('ramps-order-details-error'),
    ).toBeInTheDocument();
```

- [ ] **Step 6: Run all order-details tests**

Run: `yarn jest ui/pages/ramps/order-details`
Expected: PASS (all files, all groups).

- [ ] **Step 7: Commit**

```bash
git add ui/pages/ramps/order-details app/_locales/en/messages.json
git commit -m "feat(ramps): add order details error state and refresh retry"
```

---

## Task 5: Full-suite verification + snapshot review

**Files:** none created; verification only.

- [ ] **Step 1: Run the full order-details suite with coverage**

Run: `yarn jest ui/pages/ramps/order-details --coverage --collectCoverageFrom='ui/pages/ramps/order-details/**/*.{ts,tsx}'`
Expected: PASS; coverage on the new files ≥ 80% (SonarQube gate for new code). If below, add unit tests for the uncovered branch (e.g. missing `fiatCurrency`, empty `cryptoCurrency.symbol`, `providerOrderId` ≤ 8 chars for `shortenOrderId`).

- [ ] **Step 2: Review the generated snapshots**

Run: `git diff --stat ui/pages/ramps/order-details/**/__snapshots__`
Open each `__snapshots__` file and confirm it renders the intended state (completed shows all rows + view-on-provider; pending shows skeleton + message; error shows the error message + retry). Snapshots that look wrong mean the component is wrong — fix the component, not the snapshot.

- [ ] **Step 3: Typecheck + lint the feature**

Run: `yarn tsc --noEmit 2>&1 | grep "ramps/order-details" || echo "clean"`
Run: `yarn lint:eslint ui/pages/ramps/order-details`
Expected: clean.

- [ ] **Step 4: Verify i18n keys are well-formed and ordered**

Run: `yarn jest --testPathPattern app/_locales 2>/dev/null || node -e "JSON.parse(require('fs').readFileSync('app/_locales/en/messages.json','utf8')); console.log('messages.json parses')"`
Expected: parses; if the repo has a locale-ordering lint (`yarn verify-locales` or similar), run it and fix ordering.

- [ ] **Step 5: Commit any verification fixes**

```bash
git add -A
git commit -m "test(ramps): order details coverage and snapshot verification"
```

---

## Self-Review Notes (author)

- **Spec coverage:** completed state (Task 2) ✓; completed fields token/amount/status/order-id/date/fees/total (Task 2) ✓; view-on-provider link (Task 2) ✓; copyable order id (Task 2) ✓; pending state + "may take time" message (Task 3) ✓; error state + retry re-fetch via `refreshOrder` (Task 4) ✓; Done/Close → wallet overview (Task 1) ✓; unit + snapshot tests for the three v1 states (Tasks 2–5) ✓. Abandoned state + polling intentionally excluded (TRAM-3719 / follow-up) per spec.
- **Deviations to confirm during execution:** exact `@metamask/design-system-react` export names (`Button`, `ButtonVariant`, `Icon`, `IconName`, `TextColor.*`, `TextVariant.*`) — grep-and-match noted in Tasks 1–2. `formatCurrency` output literals in tests — correct against real output in Task 2 Step 5.
- **Out of scope confirmed:** no tab watching, no `getOrderFromCallback`, no callback route params (3717 hands us `orderId`).
