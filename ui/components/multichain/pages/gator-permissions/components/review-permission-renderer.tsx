import React from 'react';
import type { Hex } from '@metamask/utils';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  TextColor,
  TextAlign,
  TextVariant,
  Text,
  BoxAlignItems,
} from '@metamask/design-system-react';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useGatorPermissionTokenInfo } from '../../../../../hooks/gator-permissions/useGatorPermissionTokenInfo';
import {
  convertTimestampToReadableDate,
  extractExpiryToReadableDate,
  formatDecimalShiftedValue,
  GatorPermissionRule,
} from '../../../../../../shared/lib/gator-permissions';
import { Skeleton } from '../../../../component-library/skeleton';

import { PERMISSION_SCHEMAS } from '../../../../../pages/confirmations/components/confirm/info/typed-sign/typed-sign-permission/permission-detail-schemas';
import type {
  AmountField,
  I18nFunction,
  PermissionContext,
  SchemaElement,
  SchemaSection,
} from '../../../../../pages/confirmations/components/confirm/info/typed-sign/typed-sign-permission/permission-detail-schema.types';

// ---------------------------------------------------------------------------
// Shared row style
// ---------------------------------------------------------------------------

const rowStyle = { flex: '1', alignSelf: 'center' } as const;

// ---------------------------------------------------------------------------
// Reusable row component (same as in ReviewGatorPermissionItem)
// ---------------------------------------------------------------------------

type PermissionDetailRowProps = {
  label: string;
  value: React.ReactNode;
  testId?: string;
  isLoading?: boolean;
};

const PermissionDetailRow = ({
  label,
  value,
  testId,
  isLoading = false,
}: PermissionDetailRowProps): JSX.Element => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      style={rowStyle}
      gap={4}
      marginTop={2}
    >
      <Text
        textAlign={TextAlign.Left}
        color={TextColor.TextAlternative}
        variant={TextVariant.BodyMd}
      >
        {label}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.End}
        style={rowStyle}
        gap={2}
        alignItems={BoxAlignItems.Center}
      >
        <Skeleton isLoading={isLoading} width="100px" height="16px">
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Right}
            data-testid={testId}
          >
            {value}
          </Text>
        </Skeleton>
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Mapping from schema labelKeys to review-page i18n keys and testIds
// ---------------------------------------------------------------------------

type ReviewFieldMapping = {
  labelKey: string;
  testId: string;
  /** If true, append "/sec" to the formatted amount. */
  isRatePerSecond?: boolean;
};

/**
 * Maps schema field labelKeys to review-page-specific labels and testIds.
 * Fields not in this map are rendered using the schema labelKey directly.
 */
const REVIEW_FIELD_MAP: Record<string, ReviewFieldMapping> = {
  confirmFieldInitialAllowance: {
    labelKey: 'gatorPermissionsInitialAllowance',
    testId: 'review-gator-permission-initial-allowance',
  },
  confirmFieldMaxAllowance: {
    labelKey: 'gatorPermissionsMaxAllowance',
    testId: 'review-gator-permission-max-allowance',
  },
  confirmFieldStartDate: {
    labelKey: 'gatorPermissionsStartDate',
    testId: 'review-gator-permission-start-date',
  },
  confirmFieldStreamRate: {
    labelKey: 'gatorPermissionsStreamRate',
    testId: 'review-gator-permission-stream-rate',
    isRatePerSecond: true,
  },
  // Note: confirmFieldAllowance, confirmFieldFrequency, confirmFieldAvailablePerDay
  // are intentionally omitted — the review page shows these in the collapsed summary
  // or not at all, so they are skipped by the renderer.
};

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatHexAmount(
  hexValue: Hex,
  decimals: number | undefined,
  symbol: string,
): string {
  const formatted = formatDecimalShiftedValue(hexValue, decimals);
  const suffix = typeof decimals === 'number' ? '' : ' (raw units)';
  return `${formatted} ${symbol}${suffix}`;
}

function formatRawAmount(
  rawValue: Hex | import('bignumber.js').BigNumber,
  decimals: number | undefined,
  symbol: string,
): string {
  let hexValue: Hex;
  if (typeof rawValue === 'string') {
    hexValue = rawValue;
  } else {
    hexValue = `0x${rawValue.toString(16)}` as Hex;
  }
  return formatHexAmount(hexValue, decimals, symbol);
}

// ---------------------------------------------------------------------------
// Element renderer
// ---------------------------------------------------------------------------

function renderElement(
  element: SchemaElement,
  ctx: PermissionContext,
  tokenSymbol: string,
  tokenDecimals: number | undefined,
  loading: boolean,
  index: number,
  rules?: GatorPermissionRule[] | null,
): React.ReactNode {
  if ('visible' in element && element.visible && !element.visible(ctx)) {
    return null;
  }

  switch (element.type) {
    case 'amount': {
      // Only render amount fields that have a review-page mapping
      const mapping = REVIEW_FIELD_MAP[element.labelKey];
      if (!mapping) {
        return null;
      }
      return renderAmountElement(
        element,
        ctx,
        tokenSymbol,
        tokenDecimals,
        loading,
        index,
      );
    }

    case 'text': {
      // Only render text fields that have a review-page mapping
      const mapping = REVIEW_FIELD_MAP[element.labelKey];
      if (!mapping) {
        return null;
      }
      return (
        <PermissionDetailRow
          key={index}
          label={ctx.t(mapping.labelKey)}
          value={element.getValue(ctx)}
          testId={mapping.testId}
        />
      );
    }

    case 'date': {
      const mapping = REVIEW_FIELD_MAP[element.labelKey];
      if (!mapping) {
        return null;
      }
      return (
        <PermissionDetailRow
          key={index}
          label={ctx.t(mapping.labelKey)}
          value={convertTimestampToReadableDate(element.getTimestamp(ctx))}
          testId={mapping.testId}
        />
      );
    }

    case 'expiry':
      return renderExpiryElement(ctx, index, rules);

    // These field types are not shown in the review page
    case 'totalExposure':
    case 'divider':
    case 'justification':
    case 'signingInWith':
    case 'origin':
    case 'address':
    case 'network':
      return null;

    default:
      return null;
  }
}

function renderAmountElement(
  element: AmountField,
  ctx: PermissionContext,
  tokenSymbol: string,
  tokenDecimals: number | undefined,
  loading: boolean,
  index: number,
): React.ReactNode {
  const mapping = REVIEW_FIELD_MAP[element.labelKey];
  const rawValue = element.getValue(ctx);
  let displayValue = formatRawAmount(rawValue, tokenDecimals, tokenSymbol);

  if (mapping?.isRatePerSecond) {
    displayValue = `${displayValue}/sec`;
  }

  return (
    <PermissionDetailRow
      key={index}
      label={ctx.t(mapping?.labelKey ?? element.labelKey)}
      value={displayValue}
      testId={mapping?.testId}
      isLoading={loading}
    />
  );
}

function renderExpiryElement(
  ctx: PermissionContext,
  index: number,
  rules?: GatorPermissionRule[] | null,
): React.ReactNode {
  let displayValue: string;
  if (rules?.length) {
    const expiryDate = extractExpiryToReadableDate(rules);
    displayValue = expiryDate || ctx.t('gatorPermissionNoExpiration');
  } else if (ctx.expiry === null) {
    displayValue = ctx.t('gatorPermissionNoExpiration');
  } else {
    displayValue = convertTimestampToReadableDate(ctx.expiry);
  }

  return (
    <PermissionDetailRow
      key={index}
      label={ctx.t('gatorPermissionsExpirationDate')}
      value={displayValue}
      testId="review-gator-permission-expiration-date"
    />
  );
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

function renderSection(
  section: SchemaSection,
  ctx: PermissionContext,
  tokenSymbol: string,
  tokenDecimals: number | undefined,
  loading: boolean,
  rules?: GatorPermissionRule[] | null,
): React.ReactNode {
  return (
    <React.Fragment key={section.testId}>
      {section.elements.map((element, index) =>
        renderElement(
          element,
          ctx,
          tokenSymbol,
          tokenDecimals,
          loading,
          index,
          rules,
        ),
      )}
    </React.Fragment>
  );
}

// ---------------------------------------------------------------------------
// Main renderer component
// ---------------------------------------------------------------------------

export type ReviewPermissionRendererProps = {
  permissionType: string;
  permissionData: Record<string, unknown>;
  chainId: Hex;
  tokenAddress?: string;
  expiry: number | null;
  rules?: GatorPermissionRule[] | null;
};

/**
 * Review-page renderer that interprets the shared permission schema.
 * Renders each schema element as a `PermissionDetailRow` with string-formatted values.
 *
 * @param props - The component props
 * @param props.permissionType - The permission type string
 * @param props.permissionData - The permission data record
 * @param props.chainId - The chain ID in hex format
 * @param props.tokenAddress - Optional token contract address
 * @param props.expiry - Expiry timestamp or null
 * @param props.rules - Optional permission rules array
 * @returns JSX element containing the rendered permission details
 */
export const ReviewPermissionRenderer: React.FC<
  ReviewPermissionRendererProps
> = ({
  permissionType,
  permissionData,
  chainId,
  tokenAddress,
  expiry,
  rules,
}) => {
  const t = useI18nContext() as I18nFunction;

  // Hook must be called unconditionally (before any early returns)
  const { tokenInfo, loading } = useGatorPermissionTokenInfo(
    tokenAddress,
    chainId,
    permissionType,
  );

  const schemaEntry = PERMISSION_SCHEMAS[permissionType];
  if (!schemaEntry) {
    return null;
  }

  if (schemaEntry.validate) {
    schemaEntry.validate({ data: permissionData });
  }

  const ctx: PermissionContext = {
    permission: { type: permissionType, data: permissionData },
    expiry,
    chainId,
    origin: '',
    t,
    tokenInfo: {
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
    },
  };

  return (
    <>
      {schemaEntry.sections.map((section) =>
        renderSection(
          section,
          ctx,
          tokenInfo.symbol,
          tokenInfo.decimals,
          loading,
          rules,
        ),
      )}
    </>
  );
};
