export const METAMASK_CONTROLLER_EVENTS = {
    // Fired after state changes that impact the extension badge (unapproved msg count)
    // The process of updating the badge happens in app/scripts/background.js.
    UPDATE_BADGE: 'updateBadge',
    // TODO: Add this and similar enums to @metamask/controllers and export them
    APPROVAL_STATE_CHANGE: 'ApprovalController:stateChange',
  };
  