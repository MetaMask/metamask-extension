async function main() {
    
    // await chrome.scripting.unregisterContentScripts();
    var scripts = [{
        id: 'script'+Math.random().toFixed(5),
        matches: ['http://*/*'],
        js: ['contentscript.js'],
        world: "MAIN",
        runAt: 'document_start',
    }];
    await chrome.scripting.registerContentScripts(scripts);
    // await chrome.scripting.registerContentScripts([]);

}

main();