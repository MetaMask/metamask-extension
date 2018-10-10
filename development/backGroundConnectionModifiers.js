module.exports = {
  'confirm sig requests': {
    signMessage: (msgData, cb) => {
      const stateUpdate = {
        unapprovedMsgs: {},
        unapprovedMsgCount: 0,
      }
      return cb(null, stateUpdate)
    },
    signPersonalMessage: (msgData, cb) => {
      const stateUpdate = {
        unapprovedPersonalMsgs: {},
        unapprovedPersonalMsgCount: 0,
      }
      return cb(null, stateUpdate)
    },
    signTypedMessage: (msgData, cb) => {
      const stateUpdate = {
        unapprovedTypedMessages: {},
        unapprovedTypedMessagesCount: 0,
      }
      return cb(null, stateUpdate)
    },
  },
}

