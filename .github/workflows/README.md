# GitHub Actions

`pages.yml` builds and tests a production WebAssembly bundle on pull requests and pushes to main. Only successful main-branch runs publish the tested bundle to GitHub Pages. Set the repository Pages source to **GitHub Actions**. The deployment job uses the `github-pages` environment and narrowly scoped Pages permissions; pull request builds cannot deploy.

Tool and action revisions are pinned. The release preset includes the complete test suite. `scripts/check_site.py` restricts the publication artifact to the expected website files. Local references, source, tests, and generated test binaries are not uploaded to Pages.
