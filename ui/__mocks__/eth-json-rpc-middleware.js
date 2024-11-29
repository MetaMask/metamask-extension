// eslint-disable-next-line import/no-extraneous-dependencies, node/no-extraneous-require
const ethJsonRpcMiddleware = require('@metamask/eth-json-rpc-middleware');

module.exports = {
  ...ethJsonRpcMiddleware,
};
