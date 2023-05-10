import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

/**
 * This RPC method gets the address book.
 */

const getAddressBook = {
  methodNames: [MESSAGE_TYPE.GET_ADDRESS_BOOK],
  implementation: getAddressBookHandler,
  hookNames: {
    getAddressBook: true,
  },
};
export default getAddressBook;

/**
 * @typedef {object} AddressBookHandlerResult
 * TODO: Add correct properties here.
 * @property {string} chainId - The current chain ID.
 */

/**
 * @typedef {object} AddressBookHandlerOptions
 * @property {() => AddressBookHandlerResult} getAddressBook - A function that
 * gets the current address book state.
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<[]>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<AddressBookHandlerResult>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {AddressBookHandlerOptions} options
 */
async function getAddressBookHandler(
  req,
  res,
  _next,
  end,
  { getAddressBook: _getAddressBook },
) {
  res.result = {
    ...(await _getAddressBook(req.origin)),
  };
  return end();
}
