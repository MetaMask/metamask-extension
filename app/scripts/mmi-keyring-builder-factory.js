
/**
 * Get builder function for MMI keyrings which require an additional `opts`
 * parameter, used to pass MMI configuration.
 *
 * Returns a builder function for `Keyring` with a `type` property.
 *
 * @param {Keyring} Keyring - The Keyring class for the builder.
 * @returns {Function} A builder function for the given Keyring.
 */
function mmiKeyringBuilderFactory(Keyring, opts) {
  const builder = () => new Keyring(opts);

  builder.type = Keyring.type;

  return builder;
}

module.exports = {
  mmiKeyringBuilderFactory,
};
