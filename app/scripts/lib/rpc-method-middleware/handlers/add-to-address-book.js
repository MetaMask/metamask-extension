import { ethErrors, errorCodes } from 'eth-rpc-errors';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

const addToAddressBook = {
  methodNames: [MESSAGE_TYPE.ADD_TO_ADDRESS_BOOK],
  implementation: addToAddressBookHandler,
  hookNames: { requestUserApproval: true },
};
export default addToAddressBook;

async function addToAddressBookHandler(
  req,
  res,
  _next,
  end,
  { requestUserApproval },
) {
  if (!req.params || typeof req.params !== 'object') {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Unexpected parameters:\n${JSON.stringify(req.params)}`,
      }),
    );
  }

  const { origin } = req;
  let requestParams = req.params;
  const isBulkRequest = Array.isArray(req.params)
    ? req.params.length > 1
    : false;

  // If request params are an array of one item, just use the single item from the array
  if (req.params.length === 1) {
    requestParams = req.params[0] || {};
  }

  try {
    const requestUserApprovalResult = await requestUserApproval({
      origin,
      type: MESSAGE_TYPE.ADD_TO_ADDRESS_BOOK,
      requestData: {
        data: requestParams,
        source: origin,
        isBulkRequest,
      },
    });
    await requestUserApprovalResult.result;
    res.result = true;
    return end();
  } catch (error) {
    // For the purposes of this method, it does not matter if the user
    // declines to add to address book. However, other errors indicate
    // that something is wrong.
    if (error.code !== errorCodes.provider.userRejectedRequest) {
      return end(error);
    }
    return end();
  }
}
