# How to take a State Dump

Sometimes a UI bug is hard to reproduce, but we'd like to rapidly develop against the application state that caused the bug.

In this case, a MetaMask developer will sometimes ask a user with a bug to perform a "state dump", so we can use some internal tools to reproduce and fix the bug.

To take a state dump, follow these steps:

1. Get the MetaMask popup to the point where it shows the bug (the developer will probably specify exactly where).
2. Open the Hamburger menu ☰
3. Open **Settings**, then **Privacy**.
4. Select **Download state logs**.
5. In the dialog, select **Download**. This downloads a JSON state-log file.
6. _Optional_: Anonymize that file if you'd like (you may change all instances of an account address to another valid account address, for example) We may automate the anonymization in the future.
7. Send that file to the developer, ideally attaching it to the issue regarding the bug.
