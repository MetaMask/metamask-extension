import EventEmitter from 'events'
import { execute, subscribe, getOperationAST } from 'graphql'
import { schema, resolvers } from './schema'
import { forAwaitEach, isAsyncIterable, createAsyncIterator } from 'iterall'

const isASubscriptionOperation = (document, operationName) => {
  const operationAST = getOperationAST(document, operationName)

  return !!operationAST && operationAST.operation === 'subscription'
}


export default class DnodeGraphQLServer extends EventEmitter {
  constructor () {
    super()
    this.sendMessage = this.sendMessage.bind(this)
  }

  sendMessage (data) {
    this.emit('sendMessage', data)
  }

  // Called from dnode on the client side
  sendGraphQLMsg ({ opId, request }) {
    const { query, variables, operationName } = request
    let executor = execute
    if (isASubscriptionOperation(query)) {
      executor = subscribe
    }
    const executionPromise = executor(
      schema,
      query,
      resolvers,
      null,
      variables,
      operationName
    )
    executionPromise.then((executionResult) => ({
      executionIterable: isAsyncIterable(executionResult) ? executionResult : createAsyncIterator([ executionResult ]),
    })).then(({ executionIterable }) => {
      forAwaitEach(
        executionIterable,
        (result) => {
          this.sendMessage({ opId, type: 'data', result })
        })
        .then(() => {
          this.sendMessage({ opId, type: 'complete', result: null })
        })
        .catch((e) => {
          let error = e
          // plain Error object cannot be JSON stringified.
          if (Object.keys(e).length === 0) {
            error = { name: e.name, message: e.message }
          }

          this.sendMessage({ opId, type: 'error', error })
        })
    })
  }

  onRemote (remote) {
    // push updates to popup
    const sendMessage = (data) => remote.sendGraphQLMsg(data)
    this.on('sendMessage', sendMessage)
    // remove update listener once the connection ends
    return () => {
      this.removeListener('sendMessage', sendMessage)
    }
  }
}
