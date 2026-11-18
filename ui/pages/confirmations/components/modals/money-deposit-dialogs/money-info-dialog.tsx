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

export type MoneyInfoDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  headerTitle?: ReactNode;
  titleId?: string;
  children: ReactNode;
  'data-testid'?: string;
  closeButtonTestId?: string;
};

/**
 * Centered, scrollable info dialog card used on the Money deposit confirmation.
 */
export function MoneyInfoDialog({
  isOpen,
  onClose,
  headerTitle,
  titleId: externalTitleId,
  children,
  'data-testid': dataTestId,
  closeButtonTestId,
}: Readonly<MoneyInfoDialogProps>) {
  const t = useI18nContext();
  const fallbackId = useId();
  const resolvedTitleId = externalTitleId ?? fallbackId;

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen onClose={onClose} restoreFocus>
      <ModalOverlay
        className="bg-black/30"
        data-testid={dataTestId ? `${dataTestId}-overlay` : undefined}
      />
      <ModalContent
        size={ModalContentSize.Sm}
        className="items-center p-4"
        modalDialogProps={{
          'aria-labelledby': resolvedTitleId,
          paddingTop: 0,
          paddingBottom: 0,
          className:
            'max-h-[calc(100vh-32px)] min-h-0 max-w-[368px] rounded-3xl',
          'data-testid': dataTestId,
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2 px-4 pt-4">
            {headerTitle ? (
              <div id={resolvedTitleId}>{headerTitle}</div>
            ) : (
              <span />
            )}
            <ButtonIcon
              iconName={IconName.Close}
              size={ButtonIconSize.Md}
              variant={ButtonIconVariant.Filled}
              ariaLabel={t('close')}
              onClick={onClose}
              className="h-9 w-9 bg-section"
              data-testid={
                closeButtonTestId ??
                (dataTestId ? `${dataTestId}-close-button` : undefined)
              }
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
