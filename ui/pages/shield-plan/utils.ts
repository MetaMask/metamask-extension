/**
 * Get the price of a product.
 *
 * @param productInfo - The product info object.
 * @returns The price of the product.
 */
export function getProductPrice(productInfo: { unitAmount: number, unitDecimals: number }): number {
  // Note: no need to use BigInt here since decimals is low (2)
  return productInfo.unitAmount / 10 ** productInfo.unitDecimals;
}
