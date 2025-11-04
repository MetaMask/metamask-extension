import { createSelectorCreator, lruMemoize } from 'reselect';
import _ from 'lodash';

export const createDeepEqualSelector = createSelectorCreator(
  lruMemoize,
  _.isEqual,
);

let state = {
  todos: [
    { id: 0, completed: false },
    { id: 1, completed: true }
  ],
  alerts: [
    { id: 0, read: false },
    { id: 1, read: true }
  ]
}

const selectCompletedTodos = (state) => {
  console.log('selector ran')
  return state.todos.filter(todo => todo.completed === true)
}

selectCompletedTodos(state) // selector ran
selectCompletedTodos(state) // selector ran
selectCompletedTodos(state) // selector ran

const memoizedSelectCompletedTodos = createDeepEqualSelector(
  [(state) => state.todos],
  todos => {
    console.log('memoized selector ran')
    return todos.filter((todo) => todo.completed === true)
  }
)

memoizedSelectCompletedTodos(state) // memoized selector ran
state.todos = Array.from([
    { id: 0, completed: true },
    { id: 1, completed: false }
  ]);
memoizedSelectCompletedTodos(state)
memoizedSelectCompletedTodos(state)

console.log(selectCompletedTodos(state) === selectCompletedTodos(state)) //=> false

console.log(
  memoizedSelectCompletedTodos(state) === memoizedSelectCompletedTodos(state)
) //=> true
