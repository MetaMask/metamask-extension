import { produce, applyPatches } from 'immer';

// version 6
import { enablePatches } from 'immer';
enablePatches();

let state = {
  name: 'Micheal',
  age: 32,
};

// Let's assume the user is in a wizard, and we don't know whether
// his changes should end up in the base state ultimately or not...
let fork = state;
// all the changes the user made in the wizard
let changes = [];
// the inverse of all the changes made in the wizard
let inverseChanges = [];

fork = produce(
  fork,
  (draft) => {
    draft.age = 33;
  },
  // The third argument to produce is a callback to which the patches will be fed
  (patches, inversePatches) => {
    changes.push(...patches);
    inverseChanges.push(...inversePatches);
  },
);

// In the meantime, our original state is replaced, as, for example,
// some changes were received from the server
// let newState = produce(state, (draft) => {
//   draft.name = 'Michel';
// });

// When the wizard finishes (successfully) we can replay the changes that were in the fork onto the *new* state!
let newState = applyPatches(state, inverseChanges);

console.log(newState === state)

// // state now contains the changes from both code paths!
// expect(state).toEqual({
//   name: 'Michel', // changed by the server
//   age: 33, // changed by the wizard
// });

// // Finally, even after finishing the wizard, the user might change his mind and undo his changes...
// state = applyPatches(state, inverseChanges);
// expect(state).toEqual({
//   name: 'Michel', // Not reverted
//   age: 32, // Reverted
// });
