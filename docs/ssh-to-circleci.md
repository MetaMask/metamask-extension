# Debugging E2E tests by connecting to CircleCI over SSH and VNC

Developers often say "I can't reproduce this CI failure locally, but it fails on CircleCI."

If you find yourself in that situation, one option is to use Codespaces, which can reproduce some of these failures, and is a little bit easier to use.

The other NEW option is to SSH into CircleCI and use VNC.

1. You must be logged into CircleCI and have access to metamask-extension
2. "Rerun job with SSH" [Documentation](https://circleci.com/docs/ssh-access-jobs/)
3. Look for this instruction

   ```
   You can now SSH into this box if your SSH public key is added:
       $ ssh -p xxxxx xxx.xxx.xxx.xxx
   ```

4. Copy the command that CircleCI gives you and add `-L 5902:localhost:5901` (this will tunnel the VNC connection over SSH)
5. When you login to SSH, it automatically executes `/.circleci/scripts/enable-vnc.sh` to set up the connection
6. Use your favorite VNC viewer on your local machine to connect to `localhost:5902`
   - Mac: Finder menu > GO > Connect to server (or <Cmd> + K), then use `vnc://localhost:5902`
   - Linux: `tigervnc-viewer` is a good package to match the server
   - Windows: [RealVNC Viewer](https://www.realvnc.com/en/connect/download/viewer/windows/) or [TightVNC](https://www.tightvnc.com/download.php)
7. Run your E2E tests as usual and watch the browser open in VNC

### Notes:

- **Warning:** Be careful with parallelism. If you run "Rerun job with SSH" on a job that has `parallelism: 24`, it will rerun all 24 VMs with SSH.
- **Warning:** The original E2E tests are probably still running in the background, but they are not displayed in the VNC window. You may want to kill their process. In a future version, we may be able to display them in VNC.
- This procedure was based on the documentation from CircleCI, which does not work as written https://circleci.com/docs/browser-testing/#interacting-with-the-browser-over-vnc_
