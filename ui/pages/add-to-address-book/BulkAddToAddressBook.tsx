import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import { ethErrors } from 'eth-rpc-errors';
import { PageContainerFooter } from '../../components/ui/page-container';
import Box from '../../components/ui/box/box';
import { Tag, Text, ValidTag } from '../../components/component-library';
import { ellipsify } from '../send/send.utils';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  FLEX_DIRECTION,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import {
  addToAddressBook,
  rejectPendingApproval,
  resolvePendingApproval,
} from '../../store/actions';
import { I18nContext } from '../../contexts/i18n';

interface AddressBookRequest {
  data: AddressBookRequestData[];
  source: string;
  isBulkRequest: boolean;
}

interface AddressBookRequestData {
  address: string;
  name: string;
  memo?: string;
  tags?: any;
  type?: string;
}

const BulkAddToAddressBook = ({
  pendingApproval,
}: {
  pendingApproval: any;
}) => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const pendingApprovalId: string = pendingApproval?.id || '';
  const pendingApprovalRequest: AddressBookRequest =
    pendingApproval?.requestData || {};
  const source: string = pendingApprovalRequest.source || '';

  return (
    <div className="page-container">
      <div className="page-container__header">
        <div className="page-container__title">Confirm contacts</div>
        <div className="page-container__subtitle">
          Please confirm if you would like to add the following addresses to
          your contacts.
        </div>
      </div>
      <div className="page-container__content">
        <div className="add-to-address-book__content">
          {pendingApprovalRequest.data?.map((item: any) => (
            <Box
              flexDirection={FLEX_DIRECTION.ROW}
              key={item.address}
              padding={2}
              marginTop={4}
              borderRadius={BorderRadius.SM}
              borderColor={BorderColor.borderMuted}
            >
              <Box
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.center}
              >
                <div>
                  <Text
                    variant={TextVariant.bodyMdBold}
                    as={ValidTag.P}
                    color={TextColor.textDefault}
                  >
                    {item.name || 'New Contact'}
                  </Text>
                  <Text
                    variant={TextVariant.bodySm}
                    as={ValidTag.P}
                    color={TextColor.textMuted}
                  >
                    {ellipsify(item.address)}
                  </Text>
                </div>
                {item.tags && item.tags.length > 0 ? (
                  item.tags.map((tag: string) => {
                    if (tag === 'allowList') {
                      return (
                        <Tag
                          className=""
                          label="Allow List"
                          labelProps={{ color: 'primary-inverse' }}
                          labelSize="bodyXs"
                          backgroundColor="success-default"
                          boxPadding={3}
                        />
                      );
                    } else if (tag === 'blockList') {
                      return (
                        <Tag
                          className=""
                          label="Block List"
                          labelProps={{ color: 'primary-inverse' }}
                          labelSize="bodyXs"
                          backgroundColor="error-default"
                          boxPadding={3}
                        />
                      );
                    }
                    return null;
                  })
                ) : (
                  <div />
                )}
              </Box>
            </Box>
          ))}
        </div>
      </div>
      <PageContainerFooter
        cancelText={t('cancel')}
        submitText={t('submit')}
        onCancel={() => {
          dispatch(
            rejectPendingApproval(
              pendingApprovalId,
              ethErrors.provider.userRejectedRequest().serialize(),
            ),
          );
        }}
        onSubmit={async () => {
          pendingApprovalRequest.data?.forEach(
            async (req: AddressBookRequestData) =>
              await dispatch(
                addToAddressBook(
                  req.address,
                  req.name || 'New Contact',
                  req.memo || '',
                  req.tags || [],
                  source,
                ),
              ),
          );
          dispatch(resolvePendingApproval(pendingApprovalId, true));
        }}
      />
    </div>
  );
};

export default BulkAddToAddressBook;
