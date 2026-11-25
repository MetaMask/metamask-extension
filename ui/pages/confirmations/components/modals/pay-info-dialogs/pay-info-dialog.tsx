import React, { useId, type ReactNode } from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonIconVariant,
  IconName,
  Modal,
  ModalContent,
  ModalContentSize,
  ModalOverlay,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type PayInfoDialogProps = {
  children: ReactNode;
  closeButtonTestId?: string;
  'data-testid'?: string;
  headerTitle?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  titleId?: string;
};

/**
 * Centered, scrollable info dialog shell used by MetaMask Pay confirmations.
 */
export function PayInfoDialog({
  children,
  closeButtonTestId,
  'data-testid': dataTestId,
  headerTitle,
  isOpen,
  onClose,
  titleId: externalTitleId,
}: Readonly<PayInfoDialogProps>) {
  const t = useI18nContext();
  const fallbackId = useId();
  const resolvedTitleId = externalTitleId ?? fallbackId;

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen onClose={onClose} restoreFocus>
      <ModalOverlay
        data-testid={dataTestId ? `${dataTestId}-overlay` : undefined}
      />
      <ModalContent
        className="items-center p-4"
        modalDialogProps={{
          'aria-labelledby': resolvedTitleId,
          className: 'min-h-0',
          'data-testid': dataTestId,
          paddingBottom: 0,
          paddingTop: 0,
        }}
        size={ModalContentSize.Sm}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2 px-4 pt-4">
            {headerTitle ? (
              <div id={resolvedTitleId}>{headerTitle}</div>
            ) : (
              <span />
            )}
            <ButtonIcon
              ariaLabel={t('close')}
              data-testid={
                closeButtonTestId ??
                (dataTestId ? `${dataTestId}-close-button` : undefined)
              }
              iconName={IconName.Close}
              onClick={onClose}
              size={ButtonIconSize.Lg}
              variant={ButtonIconVariant.Filled}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-2">
            {children}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
