import { INVISIBLE_CHARACTER } from '../../components/component-library/text/deprecated';

export function getAccountNameErrorMessage(
  accounts,
  context,
  newAccountName,
  defaultAccountName,
) {
  const isDuplicateAccountName = accounts.some(
    (item) => item.name.toLowerCase() === newAccountName.toLowerCase(),
  );

  const isEmptyAccountName = newAccountName === '';

  const localizedWordForAccount = context
    .t('newAccountNumberName')
    .replace(' $1', '');

  // Match strings starting with ${localizedWordForAccount} and then any numeral, case insensitive
  // Trim spaces before and after
  const reservedRegEx = new RegExp(
    `^\\s*${localizedWordForAccount} \\d+\\s*$`,
    'iu',
  );
  const isReservedAccountName = reservedRegEx.test(newAccountName);

  const isValidAccountName =
    newAccountName.toLowerCase() === defaultAccountName.toLowerCase() || // What is written in the text field is the same as the placeholder
    (!isDuplicateAccountName && !isReservedAccountName && !isEmptyAccountName);

  let errorMessage;
  if (isValidAccountName) {
    errorMessage = INVISIBLE_CHARACTER; // Using an invisible character, so the spacing stays constant
  } else if (isDuplicateAccountName) {
    errorMessage = context.t('accountNameDuplicate');
  } else if (isReservedAccountName) {
    errorMessage = context.t('accountNameReserved');
  } else if (isEmptyAccountName) {
    errorMessage = context.t('required');
  }

  return { isValidAccountName, errorMessage };
}
