class Mock3Box {
  static openBox () {
    return Promise.resolve({
      onSyncDone: cb => { setTimeout(cb, 500) },
      openSpace: () => Promise.resolve({
        private: {
          get: () => Promise.resolve(null),
          set: () => Promise.resolve(null),
        },
      }),
      logout: () => {},
    })
  }
}

module.exports = Mock3Box
