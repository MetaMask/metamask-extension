
/*
IFRAME
 var pageStream = new LocalMessageDuplexStream({
    name: 'contentscript',
    target: 'inpage',
  })
SERVICEWORKER
  pageStream.on('error', console.error)
  var pluginPort = extension.runtime.connect({name: 'contentscript'})
  var pluginStream = new PortStream(pluginPort)
  pluginStream.on('error', console.error)
IFRAME --> SW
  // forward communication plugin->inpage
  pageStream.pipe(pluginStream).pipe(pageStream)
*/

module.exports = SetupUntrustedComunicationWithSW

function SetupUntrustedComunicationWithSW (connectionStream, readySwStream) {
  pageStream.on('error', console.error)
  var pluginPort = extension.runtime.connect({name: 'contentscript'})
  var pluginStream = new PortStream(pluginPort)
  pluginStream.on('error', console.error)
  // forward communication plugin->inpage
  pageStream.pipe(pluginStream).pipe(pageStream)
}
