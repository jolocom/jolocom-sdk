#!/bin/bash

set -ex

DOCS_BASE="docs"
DOCS_BUILD_BASE="docs-build"

PKG_VERSION=`node -e 'console.log(require("./package.json").version)'`

DOCS_BUILD="${DOCS_BUILD_BASE}/${PKG_VERSION}"
rm -rf "$DOCS_BUILD"

mkdir -p "$DOCS_BUILD"
typedoc --out "$DOCS_BASE/guides/api"

if [[ "$1" == "serve" ]]; then
  mkdocs serve -f docs/mkdocs.yml
else
  mkdocs build -f docs/mkdocs.yml -d "`realpath "$DOCS_BUILD"`"
fi
