import deepFreeze from 'deep-freeze-strict';
console.log('harden assigning');
window.harden = deepFreeze;
