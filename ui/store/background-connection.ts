//========
// We no longer need functions to interact with the background; all interactions
// will now take place through the UI messenger.
//
// The only thing remaining in this file is a `generateActionId` function, which
// doesn't really belong here (as it's for Redux actions). We could conceivably
// move it elsewhere, but I've left it here to make the diff cleaner.
//========
export const generateActionId = () => Date.now() + Math.random();
