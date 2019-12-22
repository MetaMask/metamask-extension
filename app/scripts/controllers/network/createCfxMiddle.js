const createAsyncMiddleware = require("json-rpc-engine/src/createAsyncMiddleware");

module.exports = { createCfxRewriteRequestMiddle };

function createCfxRewriteRequestMiddle() {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req) {
      console.log("conflux_debug", req.method);
    }
    if (req && req.method) {
      req.method = req.method.replace("eth_", "cfx_");
      req.method = req.method.replace(
        "getBlockByNumber",
        "getBlockByEpochNumber"
      );
      req.method = req.method.replace("cfx_blockNumber", "cfx_epochNumber");
    }
    await next();
  });
}
