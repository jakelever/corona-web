#!/bin/bash
set -ex

rm -fr build_to_delete tmp_build

echo "module.exports = { distDir: 'tmp_build' }" > next.config.js
npm run build
echo "module.exports = { distDir: '.next' }" > next.config.js

if [ -d .next ]; then
	mv .next build_to_delete
fi

mv tmp_build .next

# Restart server

rm -fr build_to_delete
