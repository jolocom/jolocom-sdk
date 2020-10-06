#!/bin/bash

set -ex

DOCS_BASE="docs"
DOCS_BUILD_BASE="docs-build"
DOCS_API_BASE="$DOCS_BASE/api"

PKG_VERSION=`node -e 'console.log(require("./package.json").version)'`

DOCS_BUILD="${DOCS_BUILD_BASE}/${PKG_VERSION}"
rm -rf "$DOCS_BUILD"

mkdir -p "$DOCS_BUILD"
typedoc --out "$DOCS_API_BASE"

cat > "$DOCS_BUILD_BASE/index.html" <<EOF
<html>
<head>
<title>Jolocom SDK</title>
<meta http-equiv="refresh" content="0;URL='${PKG_VERSION}'" />
</head>
</html>
EOF

if [[ "$1" == "serve" ]]; then
  mkdocs serve -f mkdocs.yml
else
  mkdocs build -f mkdocs.yml -d "`realpath "$DOCS_BUILD"`"
fi

