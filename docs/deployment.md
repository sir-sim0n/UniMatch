# Deployment

Repository: https://github.com/sir-sim0n/UniMatch

Site: https://sir-sim0n.github.io/UniMatch/

## Publish an update

Commit application changes and push to `main`. The **Test, build, and publish Orbit** workflow builds with pinned tools, runs all 16 CTest groups, checks the exact website file list, and uploads only `build/release/site`. Deployment depends on a successful build. Pull requests test without publishing. The workflow can also be run manually from Actions.

Repository Settings > Pages must use **GitHub Actions** as the source. The deployment environment is `github-pages`; its URL is reported by the deployment job. HTTPS is enforced for the default GitHub Pages domain.

The workflow uses Emscripten 4.0.15, Python 3.12.2, CMake 3.31.6, and Ninja package 1.11.1.4 on Ubuntu 24.04. GitHub actions and the Emscripten SDK checkout are pinned to verified commits. Build permissions are read-only; only the deployment job receives Pages write and OIDC permissions. No personal access token is needed in repository secrets.

## Published files

Only index.html, .nojekyll, the nineteen application assets (including the generated JavaScript module and WebAssembly binary), and two production JSON data files are deployed. The 23-file publication checker rejects missing, empty, unexpected, or symlinked files. Source documents, test fixtures, build tools, and local reference material are not part of the website artifact.

Relative asset and data URLs support the `/UniMatch/` project path. Keep its capitalization in shared links.

## Verify or troubleshoot

Check the latest workflow in Actions. A successful build alone is not a successful deployment: the deploy job must also pass. Open the Live Demo, confirm the engine is ready, then create a fictional profile and try discovery, saving, and refreshing.

If a build fails, inspect its first failing step, fix the source, and push again. If deployment fails, check Settings > Pages source, the github-pages environment, and deployment job logs. To restore an earlier version, revert the unwanted source commit and push the revert; the same tests and deployment process will run.

The local preview at `http://127.0.0.1:8000/` works only while `python scripts/serve.py` is running on your computer. It serves the debug build. The public Live Demo does not depend on that local server. Browser data is separate for each origin, so local preview bookmarks do not transfer to the public site.
