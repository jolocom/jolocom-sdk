# Jolocom Contributor Agreement
By contributing to any discussion, code, issues, pull requests, or other forms of contribution to this repository and in all other Jolocom mediums where discussion, development, and collaboration on its contents are taking place, your contributions are bound by Jolocom's standard license and attribution selections, as detailed below:

---
How to make sure your contributions can be included in the [jolocom-sdk](https://github.com/jolocom/jolocom-sdk) codebase.

---
## Documentation Copyright Policy

The copyright mode for all materials and content associated with this repository and development initiative are licensed under Creative Commons [Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/legalcode).


## Jolocom Software Licensing

Most of Jolocom's repositories like jolocom-sdk, jolocom-lib and jolocom-keriox are licensed under an [Apache 2.0 license](https://www.apache.org/licenses/LICENSE-2.0.html) - each repository contains the applicable license or copyright information. This page describes the Jolocom policy to ensure that all contributions to any Jolocom codebase are compliant to the applied license (and that the contributor has the right to license it as such).
- All contributions to Jolocom are also governed by our [Contributor Code of Conduct](https://github.com/jolocom/jolocom/blob/master/code-of-conduct).

If you are:

- a _current_ employee of Jolocom GmbH

then there is nothing extra for you to do: licensing is already handled.

Otherwise you are an "external contributor" and you must do the following:

Make sure that every file you modified or created contains a copyright notice comment like the following (at the top of the file):

   ```text
    # Copyright 2014-2020 Jolocom GmbH and Jolocom contributors
    # SPDX-License-Identifier: (Apache-2.0 AND CC-BY-4.0)
    # Code is Apache-2.0 and docs are CC-BY-4.0
   ```
   
If a copyright notice is not present, then add one.
If the first line of the file is a line beginning with #! (e.g. #!/usr/bin/python3) then leave that as the first line and add the copyright notice afterwards.
If a copyright notice is present but it says something different, then please change it to say the above.
Make sure you're using the correct syntax for comments (which varies from language to language). The example shown above is for a Python file.

### Sign your work

The sign-off is a simple line at the end of the explanation for the patch. Your
signature certifies that you wrote the patch or otherwise have the right to pass
it on as an open-source patch. The rules are pretty simple: if you can certify
the below (from [developercertificate.org](http://developercertificate.org/)):

```
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.
1 Letterman Drive
Suite D4700
San Francisco, CA, 94129

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.

Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

Then you just add a line to every git commit message:

    Signed-off-by: Emilly Example <emilly.example@email.com>

Use your real name (sorry, no pseudonyms or anonymous contributions.)

If you set your `user.name` and `user.email` git configs, you can sign your
commit automatically with `git commit -s`.

## Credits

The Developer Certificate of Origin was developed by the Linux community and has since been adopted by other projects, including many under the Linux Foundation umbrella.
The process described above (with the Signed-off-by line in Git commits) is also based on [the process used by the Linux community](https://github.com/torvalds/linux/blob/master/Documentation/process/submitting-patches.rst#11-sign-your-work---the-developers-certificate-of-origin).

# Branching Model

Inspired by [GitFlow](http://nvie.com/posts/a-successful-git-branching-model/)

## Development

- General development takes place on `develop` branch.
- Features are branched off and merged back to `develop`.
- Naming convention: `{issue-id}/{name-of-feature}`.
  - e.g. `1333/loading_issues`
- Merging back to `develop` occurs in the form of a pull request requiring a code review.
- The tests on `develop` branch should pass at all times. A developer who makes test-breaking changes must resolve them as soon as possible.

## Release

- We create a release branch from `develop`
- Naming convention: `release/{vSEM.VERSION.NUMBER}`.
  - e.g. `release/v1.6.0`
- This branch is still open for minor changes (e.g. bumping the version before release.)
- For release the `release` branch is merged into the `master` branch.
- The commit on the master branch should be tagged - this can be done through GitHub at the same time as officially creating a release at https://github.com/jolocom/smartwallet-app/releases
- Don't forget to merge the release branch back into the `develop` branch.

## Hotfixes for Production

- Bugs on `master` branch are fixed in a separate `hotfix` branch that branches off master.
- Naming convention: `hotfix/{name-of-fix}`.
  - e.g `hotfix/version_alignment`
- Don't forget to merge the hotfix branch back into the `develop` branch.


# Conventions

## Coding standards

- We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to maintain a consistent style across the codebase.
- ESLint and Prettier configuration files are included, as well as the prerequisite devDependencies in `package.json`.
- Your text editor/IDE should have plugins for these two tools.
- Your editor may also have the option to run Prettier formatting on save.
- The `yarn format` script is provided to run ESLint and Prettier rules on the codebase, auto-fixing where possible.

## Commit messages

  - Title is short and references GitHub issue # if appropriate.
  - Description is as descriptive as necessary so there is nothing unexpected introduced in the commit.
