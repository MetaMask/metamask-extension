import * as React from 'react';

export type FadeModalRef = {
  show: () => void;
  hide: () => void;
  hasHidden: () => boolean;
};

export type FadeModalProps = {
  backdrop?: boolean;
  backdropStyle?: React.CSSProperties;
  closeOnClick?: boolean;
  contentStyle?: React.CSSProperties;
  keyboard?: boolean | ((event: KeyboardEvent) => void);
  modalStyle?: React.CSSProperties;
  onShow?: () => void;
  onHide?: (source?: unknown) => void;
  children?: React.ReactNode;
  testId?: string;
};

declare const FadeModal: React.ForwardRefExoticComponent<
  FadeModalProps & React.RefAttributes<FadeModalRef | null>
>;

export default FadeModal;
