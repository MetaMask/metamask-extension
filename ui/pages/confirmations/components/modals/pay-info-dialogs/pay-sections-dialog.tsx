import React, { useId, type ReactNode } from 'react';
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';
import { PayInfoDialog } from './pay-info-dialog';

export type PayInfoSection = {
  body: ReactNode;
  id: string;
  title: ReactNode;
};

export type PaySectionsDialogProps = {
  'data-testid'?: string;
  isOpen: boolean;
  lead?: ReactNode;
  onClose: () => void;
  sections: readonly PayInfoSection[];
  subtitle?: ReactNode;
  title: ReactNode;
  titleColor?: TextColor;
};

/**
 * Sectioned MetaMask Pay info dialog displaying a headline, optional subtitle
 * and lead copy, and titled explanatory sections.
 */
export function PaySectionsDialog({
  'data-testid': dataTestId,
  isOpen,
  lead,
  onClose,
  sections,
  subtitle,
  title,
  titleColor = TextColor.TextDefault,
}: Readonly<PaySectionsDialogProps>) {
  const titleId = useId();

  return (
    <PayInfoDialog
      data-testid={dataTestId}
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Text asChild color={titleColor} variant={TextVariant.HeadingLg}>
            <h2
              data-testid={dataTestId ? `${dataTestId}-title` : undefined}
              id={titleId}
            >
              {title}
            </h2>
          </Text>
          {subtitle ? (
            <Text
              color={TextColor.TextDefault}
              data-testid={dataTestId ? `${dataTestId}-subtitle` : undefined}
              variant={TextVariant.HeadingSm}
            >
              {subtitle}
            </Text>
          ) : null}
          {lead ? (
            <Text
              className="mt-1"
              color={TextColor.TextAlternative}
              data-testid={dataTestId ? `${dataTestId}-lead` : undefined}
              variant={TextVariant.BodyMd}
            >
              {lead}
            </Text>
          ) : null}
        </div>

        {sections.map(({ body, id, title: sectionTitle }) => (
          <div key={id} className="flex flex-col gap-1">
            <Text color={TextColor.TextDefault} variant={TextVariant.HeadingSm}>
              {sectionTitle}
            </Text>
            <Text
              color={TextColor.TextAlternative}
              variant={TextVariant.BodySm}
            >
              {body}
            </Text>
          </div>
        ))}
      </div>
    </PayInfoDialog>
  );
}
