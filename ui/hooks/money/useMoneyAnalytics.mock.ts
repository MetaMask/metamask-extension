import type { MoneyAnalytics } from './useMoneyAnalytics';

export type MoneyAnalyticsMock = {
  [Key in keyof MoneyAnalytics]: jest.Mock;
};

export const createMoneyAnalyticsMock = (): MoneyAnalyticsMock => ({
  trackButtonClicked: jest.fn(),
  trackTokenButtonClicked: jest.fn(),
  trackSurfaceClicked: jest.fn(),
  trackActivitySurfaceClicked: jest.fn(),
  trackTooltipClicked: jest.fn(),
  trackScreenViewed: jest.fn(),
  trackBottomSheetViewed: jest.fn(),
  trackComponentViewed: jest.fn(),
});
