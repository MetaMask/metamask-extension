import React, { useId, type ReactNode } from 'react';
import {
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PayCheckList, type PayCheckListItem } from './pay-check-list';
import { PayInfoDialog } from './pay-info-dialog';

export type PayDialogHeroImages = {
  backgroundSrc: string;
  foregroundSrc: string;
};

export type PayChecklistDialogProps = {
  'data-testid'?: string;
  headerTitle?: string;
  headerTitleTestId?: string;
  heroImages?: PayDialogHeroImages;
  isOpen: boolean;
  items: readonly PayCheckListItem[];
  lead: ReactNode;
  leadTestId?: string;
  onClose: () => void;
  title: string;
  titleTestId?: string;
};

/**
 * MetaMask Pay info dialog presenting an overview headline, lead copy, optional
 * hero artwork, and a checkmark benefit list.
 */
export function PayChecklistDialog({
  'data-testid': dataTestId,
  headerTitle,
  headerTitleTestId,
  heroImages,
  isOpen,
  items,
  lead,
  leadTestId,
  onClose,
  title,
  titleTestId,
}: Readonly<PayChecklistDialogProps>) {
  const titleId = useId();
  const resolvedTitleTestId =
    titleTestId ?? (dataTestId ? `${dataTestId}-title` : undefined);
  const resolvedLeadTestId =
    leadTestId ?? (dataTestId ? `${dataTestId}-lead` : undefined);

  return (
    <PayInfoDialog
      data-testid={dataTestId}
      headerTitle={
        headerTitle ? (
          <Text
            asChild
            fontWeight={FontWeight.Medium}
            variant={TextVariant.HeadingSm}
          >
            <h2
              className="pl-2"
              data-testid={
                headerTitleTestId ??
                (dataTestId ? `${dataTestId}-title` : undefined)
              }
            >
              {headerTitle}
            </h2>
          </Text>
        ) : undefined
      }
      isOpen={isOpen}
      onClose={onClose}
      titleId={headerTitle ? undefined : titleId}
    >
      <div
        className={headerTitle ? 'flex flex-col gap-5' : 'flex flex-col gap-4'}
      >
        {heroImages ? (
          <div className="relative aspect-[16/9] w-full">
            <img
              alt=""
              className="absolute inset-0 h-full w-full"
              src={heroImages.backgroundSrc}
            />
            <img
              alt=""
              className="absolute left-1/2 top-1/2 w-[59%] -translate-x-1/2 -translate-y-1/2"
              src={heroImages.foregroundSrc}
            />
          </div>
        ) : null}

        {headerTitle ? (
          <div className="flex flex-col gap-3">
            <Text
              color={TextColor.TextDefault}
              data-testid={resolvedTitleTestId}
              variant={TextVariant.HeadingLg}
            >
              {title}
            </Text>
            <Text
              color={TextColor.TextAlternative}
              data-testid={resolvedLeadTestId}
              variant={TextVariant.BodyMd}
            >
              {lead}
            </Text>
          </div>
        ) : (
          <>
            <Text
              asChild
              color={TextColor.TextDefault}
              variant={TextVariant.HeadingLg}
            >
              <h2 data-testid={resolvedTitleTestId} id={titleId}>
                {title}
              </h2>
            </Text>
            <Text
              color={TextColor.TextAlternative}
              data-testid={resolvedLeadTestId}
              variant={TextVariant.BodyMd}
            >
              {lead}
            </Text>
          </>
        )}

        <PayCheckList
          className={
            headerTitle ? 'flex flex-col gap-4' : 'mt-1 flex flex-col gap-4'
          }
          items={items}
        />
      </div>
    </PayInfoDialog>
  );
}
