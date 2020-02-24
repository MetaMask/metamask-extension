export default createDnodeRemoteGetter

function createDnodeRemoteGetter (dnode) {
  let remote

  dnode.once('remote', (_remote) => {
    remote = _remote
  })

  async function getRemote () {
<<<<<<< HEAD
    if (remote) return remote
    return await new Promise(resolve => dnode.once('remote', resolve))
=======
    if (remote) {
      return remote
    }
    return await new Promise((resolve) => dnode.once('remote', resolve))
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  }

  return getRemote
}
