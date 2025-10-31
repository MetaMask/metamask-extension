import { IconName } from '@metamask/design-system-react-native';
import I18n, { strings } from '../../../../../locales/i18n';
import {
  PointsEventDto,
  SwapEventPayload,
  PerpsEventPayload,
} from '../../../../core/Engine/controllers/rewards-controller/types';
import { isNullOrUndefined } from '@metamask/utils';
import { formatUnits } from 'viem';
import { getTimeDifferenceFromNow } from '../../../../util/date';
import { getIntlNumberFormatter } from '../../../../util/intl';

/**
 * Formats a number to a string with locale-specific formatting.
 * @param value - The number to format.
 * @returns The formatted number as a string.
 */
export const formatNumber = (value: number | null): string => {
  if (value === null || value === undefined) {
    return '0';
  }
  try {
    return getIntlNumberFormatter(I18n.locale).format(value);
  } catch {
    return String(value);
  }
};

/**
 * Formats a date for rewards date
 * @param date - Date object
 * @returns Formatted date string with time
 * @example 'Jan 24 2:30 PM'
 */
export const formatRewardsDate = (
  date: Date,
  locale: string = I18n.locale,
): string =>
  new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

export const formatTimeRemaining = (endDate: Date): string | null => {
  const { days, hours, minutes } = getTimeDifferenceFromNow(endDate.getTime());

  // No time remaining
  if (hours <= 0 && minutes <= 0) {
    return null;
  }

  // Only minutes remaining
  if (hours <= 0) {
    return `${minutes}m`;
  }

  // Hours and days remaining
  return `${days}d ${hours}h`;
};

export const PerpsEventType = {
  OPEN_POSITION: 'OPEN_POSITION',
  CLOSE_POSITION: 'CLOSE_POSITION',
  TAKE_PROFIT: 'TAKE_PROFIT',
  STOP_LOSS: 'STOP_LOSS',
} as const;

export type PerpsEventType =
  (typeof PerpsEventType)[keyof typeof PerpsEventType];

const getPerpsEventDirection = (direction: string) => {
  switch (direction) {
    case 'LONG':
      return strings('perps.market.long');
    case 'SHORT':
      return strings('perps.market.short');
  }
};

const getPerpsEventTitle = (payload: PerpsEventPayload): string => {
  switch (payload.type) {
    case PerpsEventType.TAKE_PROFIT:
      return strings('rewards.events.type.take_profit');
    case PerpsEventType.CLOSE_POSITION:
      return strings('rewards.events.type.close_position');
    case PerpsEventType.STOP_LOSS:
      return strings('rewards.events.type.stop_loss');
    case PerpsEventType.OPEN_POSITION:
      return strings('rewards.events.type.open_position');
    default:
      return strings('rewards.events.type.uncategorized_event');
  }
};

const getPerpsEventDetails = (
  payload: PerpsEventPayload,
): string | undefined => {
  if (
    isNullOrUndefined(payload?.asset?.amount) ||
    isNullOrUndefined(payload?.asset?.decimals) ||
    isNullOrUndefined(payload?.asset?.symbol)
  )
    return undefined;

  const { amount, decimals, symbol } = payload.asset;
  const rawAmount = formatUnits(BigInt(amount), decimals);
  // Limit to at most 2 decimal places without padding zeros
  const formattedAmount = formatNumber(
    parseFloat(Number(rawAmount).toFixed(3)),
  );

  switch (payload.type) {
    case PerpsEventType.OPEN_POSITION:
      if (isNullOrUndefined(payload.direction)) return undefined;
      return `${getPerpsEventDirection(
        payload.direction,
      )} ${formattedAmount} ${symbol}`;
    case PerpsEventType.CLOSE_POSITION:
    case PerpsEventType.TAKE_PROFIT:
    case PerpsEventType.STOP_LOSS:
      if (payload.pnl) {
        const pnl = Number(payload.pnl);
        if (isNaN(pnl)) return `${symbol}`;
        const sign = pnl > 0 ? '+' : pnl < 0 ? '-' : '';
        const formattedAbsPnl = Math.round(Math.abs(pnl) * 100) / 100;
        return `${symbol} ${sign}$${formattedAbsPnl}`;
      }
      return `${symbol}`;
    default:
      return undefined;
  }
};

/**
 * Formats a swap event details
 * @param payload - The swap event payload
 * @returns The swap event details
 */
const getSwapEventDetails = (payload: SwapEventPayload): string | undefined => {
  if (
    isNullOrUndefined(payload.srcAsset?.amount) ||
    isNullOrUndefined(payload.srcAsset?.decimals) ||
    isNullOrUndefined(payload.srcAsset?.symbol)
  )
    return undefined;

  const { amount, decimals, symbol } = payload.srcAsset;
  const rawAmount = formatUnits(BigInt(amount), decimals);
  // Limit to at most 2 decimal places without padding zeros
  const formattedAmount = formatNumber(
    parseFloat(Number(rawAmount).toFixed(3)),
  );
  const destSymbol = payload.destAsset?.symbol;

  return `${formattedAmount} ${symbol}${
    destSymbol ? ` ${strings('rewards.events.to')} ${destSymbol}` : ''
  }`;
};

/**
 * Formats an event details
 * @param event - The event
 * @param accountName - Optional account name to display for bonus events
 * @returns The event details
 */
export const getEventDetails = (
  event: PointsEventDto,
  accountName: string | undefined,
): {
  title: string;
  details: string | undefined;
  icon: IconName;
} => {
  switch (event.type) {
    case 'SWAP':
      return {
        title: strings('rewards.events.type.swap'),
        details: getSwapEventDetails(event.payload as SwapEventPayload),
        icon: IconName.SwapVertical,
      };
    case 'PERPS':
      return {
        title: getPerpsEventTitle(event.payload as PerpsEventPayload),
        details: getPerpsEventDetails(event.payload as PerpsEventPayload),
        icon: IconName.Candlestick,
      };
    case 'REFERRAL':
      return {
        title: strings('rewards.events.type.referral_action'),
        details: undefined,
        icon: IconName.UserCircleAdd,
      };
    case 'SIGN_UP_BONUS':
      return {
        title: strings('rewards.events.type.sign_up_bonus'),
        details: accountName,
        icon: IconName.Edit,
      };
    case 'LOYALTY_BONUS':
      return {
        title: strings('rewards.events.type.loyalty_bonus'),
        details: accountName,
        icon: IconName.ThumbUp,
      };
    case 'ONE_TIME_BONUS':
      return {
        title: strings('rewards.events.type.one_time_bonus'),
        details: undefined,
        icon: IconName.Gift,
      };
    default:
      return {
        title: strings('rewards.events.type.uncategorized_event'),
        details: undefined,
        icon: IconName.Star,
      };
  }
};

// Get icon name with fallback to Star if invalid
export const getIconName = (iconName: string): IconName =>
  Object.values(IconName).includes(iconName as IconName)
    ? (iconName as IconName)
    : IconName.Star;

// Format Url for display
export const formatUrl = (url: string): string => {
  if (!url) {
    return '';
  }

  // Clean up the input: trim whitespace and remove backticks
  const cleanedUrl = url.trim().replace(/((^`)|(`$))/g, '');

  try {
    const urlObj = new URL(cleanedUrl);
    // For http/https URLs, return just the hostname
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      // Check if the original URL contains Unicode characters to preserve them
      const originalHostMatch = cleanedUrl.match(/^https?:\/\/([^/?#]+)/);
      if (originalHostMatch) {
        const originalHost = originalHostMatch[1];
        // If the original contains Unicode characters (non-ASCII), use it instead of punycode
        if (
          /[^\u0020-\u007E]/.test(originalHost) &&
          !originalHost.includes('%')
        ) {
          return originalHost;
        }
      }
      // For encoded URLs or ASCII domains, use the URL object's hostname which handles decoding
      return urlObj.hostname;
    }
    // For other protocols (file:, mailto:, etc.), return the original URL
    return cleanedUrl;
  } catch {
    // Fallback: manually strip protocol and query strings for http/https
    if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
      let cleanUrl = cleanedUrl.replace(/^https?:\/\//, '');
      const queryIndex = cleanUrl.indexOf('?');
      if (queryIndex !== -1) {
        cleanUrl = cleanUrl.substring(0, queryIndex);
      }
      return cleanUrl;
    }
    // For URLs without protocol, strip query parameters
    const queryIndex = cleanedUrl.indexOf('?');
    if (queryIndex !== -1) {
      return cleanedUrl.substring(0, queryIndex);
    }
    // For non-http protocols or malformed URLs, return as-is
    return cleanedUrl;
  }
};
