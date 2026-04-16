/**
 * Query parameter names for the multichain account address list page
 */
export enum AddressListQueryParams {
  Source = 'source',
}

/**
 * Source values for the multichain account address list page
 * Used to determine the context/mode of the page
 */
export enum AddressListSource {
  /**
   * When the page is opened from the receive flow
   */
  Receive = 'receive',
}
