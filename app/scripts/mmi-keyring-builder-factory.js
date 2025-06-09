/**
 * Get builder function for MMI keyrings which require an additional `opts`
 * parameter, used to pass MMI configuration.
 *
 * Returns a builder function for `Keyring` with a `type` property.
 *
 * @param {Keyring} Keyring - The Keyring class for the builder.
 * @param {Keyring} opts - Optional parameters to be passed to the builder.
 * @returns {Function} A builder function for the given Keyring.
 */
export function mmiKeyringBuilderFactory(Keyring, opts) {
  const builder = () => new Keyring(opts);

  builder.type = Keyring.type;

  return builder;
}
