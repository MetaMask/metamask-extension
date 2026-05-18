import type { BoxSpacing } from '@metamask/design-system-react';

export enum CameraAccessErrorContentVariant {
  Needed = 'needed',
  Blocked = 'blocked',
}

/** Optional root `Box` padding (design-system spacing scale). Both variants support these. */
export type CameraAccessErrorContentRootLayoutProps = {
  /**
   * Horizontal padding on the outermost wrapper. Default `4`.
   * Use `0` when a parent already provides horizontal padding (e.g. `ModalBody`).
   */
  rootPaddingHorizontal?: BoxSpacing;
  /**
   * Bottom padding on the outermost wrapper. Default `4`.
   * Use `0` when a parent already provides bottom padding.
   */
  rootPaddingBottom?: BoxSpacing;
};

export type CameraAccessErrorContentNeededProps =
  CameraAccessErrorContentRootLayoutProps & {
    variant: CameraAccessErrorContentVariant.Needed;
    onContinue: () => void | Promise<void>;
    continueLoading?: boolean;
  };

export type CameraAccessErrorContentBlockedProps =
  CameraAccessErrorContentRootLayoutProps & {
    variant: CameraAccessErrorContentVariant.Blocked;
    isFirefox: boolean;
    onContinue: () => void | Promise<void>;
    continueLoading?: boolean;
    /** Used for Firefox step 2; ignored when `isFirefox` is false. */
    mozExtensionDisplay: string;
    /** Used for Chromium “Open settings”; ignored when `isFirefox` is true. */
    onOpenSettings: () => void;
  };

export type CameraAccessErrorContentProps =
  | CameraAccessErrorContentNeededProps
  | CameraAccessErrorContentBlockedProps;
