import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { isValidHexAddress } from '@metamask/controller-utils';
import { ethErrors } from 'eth-rpc-errors';
import { PageContainerFooter } from '../../components/ui/page-container';
import { I18nContext } from '../../contexts/i18n';
import TextField from '../../components/ui/text-field';
import Box from '../../components/ui/box/box';
import CheckBox from '../../components/ui/check-box';
import { Label, Text } from '../../components/component-library';
import {
  AlignItems,
  FLEX_DIRECTION,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { isValidDomainName } from '../../helpers/utils/util';
import { isBurnAddress } from '../../../shared/modules/hexstring-utils';
import { INVALID_RECIPIENT_ADDRESS_ERROR } from '../send/send.constants';
import {
  addToAddressBook,
  rejectPendingApproval,
  resolvePendingApproval,
} from '../../store/actions';
import { getPendingApprovals } from '../../selectors';

const ALLOW_LIST = 'allowList';
const BLOCK_LIST = 'blockList';

const AddToAddressBook = ({
  address = '',
  name = '',
  memo = '',
  tags = [],
}) => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const pendingApprovals = useSelector(getPendingApprovals);
  const pendingApprovalId = pendingApprovals[0].id;

  const [nameInput, setNameInput] = useState(name);
  const [memoInput, setMemoInput] = useState(memo);
  const [addressInput, setAddressInput] = useState(address);
  const [inputTags, setInputTags] = useState(tags);
  const [error, setError] = useState('');

  const validate = (newAddress) => {
    const valid =
      !isBurnAddress(newAddress) &&
      isValidHexAddress(newAddress, { mixedCaseUseChecksum: true });
    const validEnsAddress = isValidDomainName(newAddress);
    if (valid || validEnsAddress || newAddress === '') {
      setError('');
    } else {
      setError(INVALID_RECIPIENT_ADDRESS_ERROR);
    }
  };

  const handleNameChange = (event) => {
    setNameInput(event.target.value);
  };

  const handleMemoChange = (event) => {
    setMemoInput(event.target.value);
  };

  const handleAddressChange = (event) => {
    setAddressInput(event.target.value);
    validate(event.target.value);
  };

  const addAllowList = () => {
    if (inputTags.includes(ALLOW_LIST)) {
      setInputTags(inputTags.filter((tag) => tag !== ALLOW_LIST));
    } else {
      setInputTags([...inputTags, ALLOW_LIST]);
    }
  };

  const addBlockList = () => {
    if (inputTags.includes(BLOCK_LIST)) {
      setInputTags(inputTags.filter((tag) => tag !== BLOCK_LIST));
    } else {
      setInputTags([...inputTags, BLOCK_LIST]);
    }
  };

  return (
    <div className="page-container">
      <div className="page-container__header">
        <div className="page-container__title">Add contact</div>
        <div className="page-container__subtitle">
          Add a new contact to your address book and choose whether they should
          be on your allow or block list.
        </div>
      </div>
      <div className="page-container__content">
        <div className="add-to-address-book__content">
          <div className="add-to-address-book__content__name-label">
            {t('address')}
          </div>
          <TextField
            className="add-to-address-book__content__text-field"
            value={addressInput}
            onChange={handleAddressChange}
            placeholder="Add an address"
            fullWidth
          />
          {error && (
            <div className="address-book__add-contact__error">{t(error)}</div>
          )}
          <div className="add-to-address-book__content__name-label">
            {t('name')}
          </div>
          <TextField
            className="add-to-address-book__content__text-field"
            value={nameInput}
            onChange={handleNameChange}
            placeholder="Add a name"
            fullWidth
          />
          <div className="add-to-address-book__content__label--capitalized">
            {t('memo')}
          </div>
          <TextField
            type="text"
            id="memo"
            value={memoInput}
            onChange={handleMemoChange}
            placeholder={t('addMemo')}
            fullWidth
            margin="dense"
            multiline
            rows={3}
            classes={{
              inputMultiline: 'add-to-address-book__content__text-area',
              inputRoot: 'add-to-address-book__content__text-area-wrapper',
            }}
          />
        </div>
        <div className="add-to-address-book__row">
          <Box
            flexDirection={FLEX_DIRECTION.ROW}
            alignItems={AlignItems.flexStart}
            paddingLeft={4}
            paddingBottom={4}
            gap={2}
          >
            <CheckBox
              value="allowList"
              onClick={addAllowList}
              id="allow-list-checkbox"
              checked={inputTags.length > 0 && inputTags.includes(ALLOW_LIST)}
            />
            <Label htmlFor="allow-list-checkbox">
              <Text
                variant={TextVariant.bodyMdBold}
                as="span"
                color={TextColor.successDefault}
              >
                Allow List
              </Text>
            </Label>
          </Box>
          <Box
            flexDirection={FLEX_DIRECTION.ROW}
            alignItems={AlignItems.flexStart}
            paddingLeft={4}
            paddingBottom={4}
            gap={2}
          >
            <CheckBox
              id="block-list-checkbox"
              value="blockList"
              onClick={addBlockList}
              checked={inputTags.length > 0 && inputTags.includes(BLOCK_LIST)}
            />
            <Label htmlFor="block-list-checkbox">
              <Text
                variant={TextVariant.bodyMdBold}
                as="span"
                color={TextColor.errorDefault}
              >
                Block List
              </Text>
            </Label>
          </Box>
        </div>
      </div>
      <PageContainerFooter
        cancelText={t('cancel')}
        submitText={t('save')}
        onCancel={() => {
          dispatch(
            rejectPendingApproval(
              pendingApprovalId,
              ethErrors.provider.userRejectedRequest().serialize(),
            ),
          );
        }}
        onSubmit={async () => {
          await dispatch(
            addToAddressBook(addressInput, nameInput, memoInput, inputTags),
          );
          dispatch(resolvePendingApproval(pendingApprovalId, true));
        }}
        disabled={Boolean(error || !addressInput || !nameInput.trim())}
      />
    </div>
  );
};

export default AddToAddressBook;

AddToAddressBook.propTypes = {
  name: PropTypes.string,
  address: PropTypes.string,
  memo: PropTypes.string,
  tags: PropTypes.array,
};
