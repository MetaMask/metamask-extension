import { TransactionType } from '@metamask/transaction-controller';
import { calcTokenValue } from '../../../../shared/lib/swaps-utils';
import { parseStandardTokenTransactionData } from '../../../../shared/modules/transaction.utils';
import { getTokenAddressParam } from '../../../helpers/utils/token-util';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';

export function getCustomTxParamsData(
  data,
  { customPermissionAmount, decimals },
) {
  const tokenData = parseStandardTokenTransactionData(data);

  const customSpendingCapMethods = [
    TransactionType.tokenMethodApprove,
    TransactionType.tokenMethodIncreaseAllowance,
  ];

  if (!tokenData) {
    throw new Error('Invalid data');
  } else if (!customSpendingCapMethods.includes(tokenData.name)) {
    throw new Error(
      `Invalid data; should be ${customSpendingCapMethods
        .map((m) => `'${m}'`)
        .join(' or ')} method, but instead is '${tokenData.name}'`,
    );
  }
  let spender = getTokenAddressParam(tokenData);
  if (spender.startsWith('0x')) {
    spender = spender.substring(2);
  }
  const [signature, rest] = data.split(spender);
  if (!signature || !rest) {
    throw new Error('Invalid data');
  } else if (rest.length < 64) {
    throw new Error(
      'Invalid calldata value; must be at least 64 hex digits long',
    );
  }

  const tokenValue = rest.substring(0, 64);
  const extraCalldata = rest.substring(64);

  let customPermissionValue = decimalToHex(
    calcTokenValue(customPermissionAmount, decimals),
  );
  if (customPermissionValue.length > 64) {
    throw new Error('Custom value is larger than u256');
  }

  customPermissionValue = customPermissionValue.padStart(
    tokenValue.length,
    '0',
  );
  const customTxParamsData = `${signature}${spender}${customPermissionValue}${extraCalldata}`;
  return customTxParamsData;
}
