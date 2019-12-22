const OriginalEthQuery = require("ethjs-query");
const OriginalEthRPC = require("ethjs-rpc");
module.exports = EthQuery;

class EthRPC extends OriginalEthRPC {}

class EthQuery extends OriginalEthQuery {
  constructor(provider, options) {
    var self = this;
    var optionsObject = options || {};

    if (!(this instanceof Eth)) {
      throw new Error(
        '[ethjs-query] the Eth object requires the "new" flag in order to function normally (i.e. `const eth = new Eth(provider);`).'
      );
    }
    if (typeof provider !== "object") {
      throw new Error(
        "[ethjs-query] the Eth object requires that the first input 'provider' must be an object, got '" +
          typeof provider +
          "' (i.e. 'const eth = new Eth(provider);')"
      );
    }

    self.options = Object.assign({
      debug: optionsObject.debug || false,
      logger: optionsObject.logger || console,
      jsonSpace: optionsObject.jsonSpace || 0
    });
    self.rpc = new EthRPC(provider);
    self.setProvider = self.rpc.setProvider;
  }
}
