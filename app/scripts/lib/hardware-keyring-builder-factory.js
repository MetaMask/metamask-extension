/**
 * Get builder function for Hardware keyrings which require an additional `opts`
 * parameter, used to pass the transport bridge used by the keyring.
 *
 * Returns a builder function for `Keyring` with a `type` property.
 *
 * @param {Keyring} Keyring - The Keyring class for the builder.
 * @param {Bridge} Bridge - The transport bridge class to use for the given Keyring.
 * @returns {Function} A builder function for the given Keyring.
 */
export function hardwareKeyringBuilderFactory(Keyring, Bridge) {
  const builder = () => new Keyring({ bridge: new Bridge() });

  builder.type = Keyring.type;

  return builder;
}
