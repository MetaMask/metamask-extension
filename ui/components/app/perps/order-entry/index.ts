// Main component export
export { OrderEntry } from './order-entry';

// Type exports
export type {
  OrderEntryProps,
  OrderFormState,
  OrderDirection,
  OrderCalculations,
  DirectionTabsProps,
  AmountInputProps,
  LeverageSliderProps,
  OrderSummaryProps,
  AutoCloseSectionProps,
  TPSLUnit,
  OrderMode,
  ExistingPositionData,
  CloseAmountSectionProps,
} from './order-entry.types';

// Subcomponent exports (for advanced usage)
export { DirectionTabs } from './components/direction-tabs';
export { AmountInput } from './components/amount-input';
export { LeverageSlider } from './components/leverage-slider';
export { OrderSummary } from './components/order-summary';
export { AutoCloseSection } from './components/auto-close-section';
export { CloseAmountSection } from './components/close-amount-section';

// Mock data exports (for development/testing)
export {
  mockOrderFormDefaults,
  mockPriceData,
  mockMaxLeverage,
  mockAvailableBalance,
  BALANCE_PERCENT_PRESETS,
  LEVERAGE_PRESETS,
  calculatePositionSize,
  calculateMarginRequired,
  calculateMaxAmount,
  estimateLiquidationPrice,
} from './order-entry.mocks';
