// This file has been separated because it is required in both the gas and send
// slices. This created a circular dependency problem as both slices also
// import from the actions and selectors files. This easiest path for
// untangling is having the constants separate.

// Actions
export const BASIC_GAS_ESTIMATE_STATUS =
  'metamask/gas/BASIC_GAS_ESTIMATE_STATUS';
export const RESET_CUSTOM_DATA = 'metamask/gas/RESET_CUSTOM_DATA';
export const SET_BASIC_GAS_ESTIMATE_DATA =
  'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA';
export const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT';
export const SET_CUSTOM_GAS_PRICE = 'metamask/gas/SET_CUSTOM_GAS_PRICE';
export const SET_ESTIMATE_SOURCE = 'metamask/gas/SET_ESTIMATE_SOURCE';
