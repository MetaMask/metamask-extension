const ConfluxWeb = require("conflux-web");

module.exports = class Web3 extends ConfluxWeb {
  constructor() {
    if (arguments[0] && arguments[0]._confluxWebProvider) {
      super(arguments[0]._confluxWebProvider);
    } else {
      super(...arguments);
    }
  }

  setProvider() {
    if (arguments[0] && arguments[0]._confluxWebProvider) {
      return ConfluxWeb.prototype.setProvider.call(
        this,
        arguments[0]._confluxWebProvider.url,
        { ...arguments[0]._confluxWebProvider }
      );
    } else {
      return ConfluxWeb.prototype.setProvider.call(this, ...arguments);
    }
  }
};
