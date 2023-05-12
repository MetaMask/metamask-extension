import React, { useContext, useState, useCallback, ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';
import { isValidHexAddress } from '@metamask/controller-utils';
import { ethErrors } from 'eth-rpc-errors';
import { PageContainerFooter } from '../../components/ui/page-container';
import { I18nContext } from '../../contexts/i18n';
import TextField from '../../components/ui/text-field';
import Box from '../../components/ui/box/box';
import CheckBox from '../../components/ui/check-box';
import { Label, Text, ValidTag } from '../../components/component-library';
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

const ALLOW_LIST = 'allowList';
const BLOCK_LIST = 'blockList';

interface AddressBookRequestData {
  address: string;
  name: string;
  memo?: string;
  tags?: any;
  type?: string;
}

const SingleAddToAddressBook = ({
  pendingApproval,
}: {
  pendingApproval: any;
}) => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const pendingApprovalId = pendingApproval?.id || '';
  const pendingApprovalRequest = pendingApproval?.requestData || {};
  const pendingApprovalRequestData: AddressBookRequestData =
    pendingApprovalRequest.data || {};
  const address = pendingApprovalRequestData.address || '';
  const name = pendingApprovalRequestData.name || '';
  const memo = pendingApprovalRequestData.memo || '';
  const tags = pendingApprovalRequestData.tags || [];
  const source = pendingApprovalRequest.source || '';

  const [nameInput, setNameInput] = useState(name);
  const [memoInput, setMemoInput] = useState(memo);
  const [addressInput, setAddressInput] = useState(address);
  const [inputTags, setInputTags] = useState(tags);
  const [error, setError] = useState('');

  const validate = useCallback((newAddress: string) => {
    const valid = !isBurnAddress(newAddress) && isValidHexAddress(newAddress);
    const validEnsAddress = isValidDomainName(newAddress);
    if (valid || validEnsAddress || newAddress === '') {
      setError('');
    } else {
      setError(INVALID_RECIPIENT_ADDRESS_ERROR);
    }
  }, []);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNameInput(event.target.value);
  };

  const handleMemoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMemoInput(event.target.value);
  };

  const handleAddressChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAddressInput(event.target.value);
    validate(event.target.value);
  };

  const addAllowList = () => {
    if (inputTags.includes(ALLOW_LIST)) {
      setInputTags(inputTags.filter((tag: string) => tag !== ALLOW_LIST));
    } else {
      setInputTags([...inputTags, ALLOW_LIST]);
    }
  };

  const addBlockList = () => {
    if (inputTags.includes(BLOCK_LIST)) {
      setInputTags(inputTags.filter((tag: string) => tag !== BLOCK_LIST));
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
              title="allowList"
              onClick={addAllowList}
              id="allow-list-checkbox"
              checked={inputTags.length > 0 && inputTags.includes(ALLOW_LIST)}
            />
            <Label htmlFor="allow-list-checkbox" className="">
              <Text
                variant={TextVariant.bodyMdBold}
                as={ValidTag.Span}
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
              title="blockList"
              onClick={addBlockList}
              checked={inputTags.length > 0 && inputTags.includes(BLOCK_LIST)}
            />
            <Label htmlFor="block-list-checkbox" className="">
              <Text
                variant={TextVariant.bodyMdBold}
                as={ValidTag.Span}
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
            addToAddressBook(
              addressInput,
              nameInput,
              memoInput,
              inputTags,
              source,
            ),
          );
          dispatch(resolvePendingApproval(pendingApprovalId, true));
        }}
        disabled={Boolean(error || !addressInput || !nameInput.trim())}
      />
    </div>
  );
};

export default SingleAddToAddressBook;
