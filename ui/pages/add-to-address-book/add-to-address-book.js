import React from 'react';
import { useSelector } from 'react-redux';

import { getPendingApprovals } from '../../selectors';
import BulkAddToAddressBook from './BulkAddToAddressBook';
import SingleAddToAddressBook from './SingleAddToAddressBook';

/**
 * AddToAddressBook fetches the current wallet_addToAddressBook pending approval
 * and depending on whether it's a single or bulk add request, returns the appropriate UI.
 *
 * @returns JSX.Element
 */
const AddToAddressBook = () => {
  const pendingApprovals = useSelector(getPendingApprovals);
  const pendingApproval = pendingApprovals[0];
  const pendingApprovalRequestData = pendingApproval?.requestData;
  const isBulkRequest = pendingApprovalRequestData?.isBulkRequest;

  if (isBulkRequest) {
    return <BulkAddToAddressBook pendingApproval={pendingApproval} />;
  }
  return <SingleAddToAddressBook pendingApproval={pendingApproval} />;
};

export default AddToAddressBook;
