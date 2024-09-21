# How to take a State Dump

Sometimes a UI bug is hard to reproduce, but we'd like to rapidly develop against the application state that caused the bug.

In this case, a MetaMask developer will sometimes ask a user with a bug to perform a "state dump", so we can use some internal tools to reproduce and fix the bug.

To take a state dump, follow these steps:

1. Get the MetaMask popup to the point where it shows the bug (the developer will probably specify exactly where).
2. Right click on the extension popup UI, and in the menu, click "Inspect". This will open the developer tools.
3. In case it isn't already selected, click the "Console" tab in the new Developer Tools window.
4. In the console, type this command exactly: `logState()`. This should print a bunch of JSON text into your console.
5. Copy that printed JSON text
6. *Optional*: Anonymize that text if you'd like (you may change all instances of an account address to another valid account address, for example) We may automate the anonymization in the future.
7. Send that JSON text to the developer, ideally pasting it in the issue regarding the bug.
