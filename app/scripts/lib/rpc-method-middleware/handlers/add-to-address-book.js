import { ethErrors } from 'eth-rpc-errors';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

const addToAddressBook = {
  methodNames: [MESSAGE_TYPE.ADD_TO_ADDRESS_BOOK],
  implementation: addToAddressBookHandler,
  hookNames: {
    addToAddressBookRequest: true,
  },
};
export default addToAddressBook;

async function addToAddressBookHandler(
  req,
  res,
  _next,
  end,
  { addToAddressBookRequest },
) {
  if (!req.params || typeof req.params !== 'object') {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected single, object parameter. Received:\n${JSON.stringify(
          req.params,
        )}`,
      }),
    );
  }

  const {
    address,
    name,
    chainId = '0x1',
    memo = '',
    addressType,
    tags = [],
    source = '',
  } = req.params;

  try {
    const handleAddToAddressBookResult = await addToAddressBookRequest(
      address,
      name,
      chainId,
      memo,
      addressType,
      tags,
      source,
    );
    await handleAddToAddressBookResult.result;
    res.result = true;
    return end();
  } catch (error) {
    console.log('Error adding to address book', error);
    return end(error);
  }
}
