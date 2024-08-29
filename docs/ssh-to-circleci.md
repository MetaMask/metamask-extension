# Debugging E2E tests by connecting to CircleCI over SSH and VNC

Developers often say "I can't reproduce this CI failure locally, but it fails on CircleCI."

If you find yourself in that situation, one option is to use Codespaces, which can reproduce some of these failures, and is a little bit easier to use.

The other NEW option is to SSH into CircleCI and use VNC.

1. You must be logged into CircleCI and have access to metamask-extension
2. "Rerun job with SSH" [Documentation](https://circleci.com/docs/ssh-access-jobs/)
3. Look for this instruction inside the `Enable SSH` section

   ```
   You can now SSH into this box if your SSH public key is added:
       $ ssh -p xxxxx xxx.xxx.xxx.xxx
   ```

4. Copy the command that CircleCI gives you and append `-L 5901:localhost:5901` (this will tunnel the VNC connection over SSH)
5. Enter this in a terminal, for example `ssh -p xxxxx xxx.xxx.xxx.xxx -L 5901:localhost:5901`
6. When you login to SSH, it automatically executes `/.circleci/scripts/enable-vnc.sh` to set up the connection
7. Use your favorite VNC viewer on your local machine to connect to `localhost:5901`
   - Mac: In the Terminal, run `open vnc://localhost:5901`
   - Linux: `tigervnc-viewer` is a good package to match the server
   - Windows: [RealVNC Viewer](https://www.realvnc.com/en/connect/download/viewer/windows/) or [TightVNC](https://www.tightvnc.com/download.php)
8. The VNC password is simply `password`
9. The normal E2E tests will already be running, and you can watch them run
10. If you want to stop the normal tests and run your own tests, run `pkill timeout` (this works because .circleci/scripts/test-run-e2e.sh runs the `timeout` command)

### Notes:

- This procedure was based on the documentation from CircleCI [here](https://circleci.com/docs/browser-testing/#interacting-with-the-browser-over-vnc). The way they wrote it doesn't really work correctly, but we fixed it.
- If you run "Rerun job with SSH" on a job that has `parallelism: 24`, it will rerun all 24 VMs, but quickly shut down all but the first one.
- **Advanced Usage:** If you don't want to run the `.bashrc` when you connect, append this to the SSH command `-t bash --norc --noprofile`
