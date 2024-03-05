import type {
  ResultComponent,
  ErrorResult,
} from '@metamask/approval-controller';
import { IconName } from '../../../../../ui/components/component-library/icon';
import { SnapKeyringBuilderMessenger } from '../types';

const snapAuthorshipHeader = (snapId: string): ResultComponent => {
  return {
    name: 'SnapAuthorshipHeader',
    key: 'snapHeader',
    properties: { snapId },
  } as ResultComponent;
};

/**
 * Options for result pages.
 */
export type ResultComponentOptions = {
  /**
   * The title to display above the message. Shown by default but can be hidden with `null`.
   */
  title: string | null;

  /**
   * The icon to display in the page. Shown by default but can be hidden with `null`.
   */
  icon: IconName | null;
};

/**
 * Shows an error result page.
 *
 * @param controllerMessenger - The controller messenger instance.
 * @param snapId - The Snap unique id.
 * @param opts - The result component options (title, icon).
 * @param properties - The properties used by SnapAccountErrorMessage component.
 * @returns Returns a promise that resolves once the user clicks the confirm
 * button.
 */
export const showError = (
  controllerMessenger: SnapKeyringBuilderMessenger,
  snapId: string,
  opts: ResultComponentOptions,
  properties: Record<string, any>,
): Promise<ErrorResult> => {
  return controllerMessenger.call('ApprovalController:showError', {
    header: [snapAuthorshipHeader(snapId)],
    title: opts.title,
    icon: opts.icon,
    error: {
      key: 'snapAccountErrorMessage',
      name: 'SnapAccountErrorMessage',
      properties,
    },
  });
};

/**
 * Shows a success result page.
 *
 * @param controllerMessenger - The controller messenger instance.
 * @param snapId - The Snap unique id.
 * @param opts - The result component options (title, icon).
 * @param properties - The properties used by SnapAccountSuccessMessage component.
 * @returns Returns a promise that resolves once the user clicks the confirm
 * button.
 */
export const showSuccess = (
  controllerMessenger: SnapKeyringBuilderMessenger,
  snapId: string,
  opts: ResultComponentOptions,
  properties: Record<string, any>,
): Promise<ErrorResult> => {
  return controllerMessenger.call('ApprovalController:showSuccess', {
    header: [snapAuthorshipHeader(snapId)],
    title: opts.title,
    icon: opts.icon,
    message: {
      key: 'snapAccountSuccessMessage',
      name: 'SnapAccountSuccessMessage',
      properties,
    },
  });
};
