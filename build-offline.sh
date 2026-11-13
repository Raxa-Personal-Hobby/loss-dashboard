#!/bin/bash
# Builds one offline HTML file into ./offline. The start screen picks the industry template
# from the user's NAICS code. No AI or platform code is included.
set -e
cd "$(dirname "$0")"
LOSS_OFFLINE=1 bash bundle.sh
rm -rf offline && mkdir -p offline
node -e '
const fs = require("fs");
const src = fs.readFileSync("bundle.html", "utf8");
const m = src.match(/^<!DOCTYPE html><html[^>]*>/i);
if (!m) throw new Error("unexpected bundle start");
// Content-Security-Policy: the browser itself blocks any network request (connect-src allows only data: and blob:).
const csp = `<meta http-equiv="Content-Security-Policy" content="default-src \u0027none\u0027; script-src \u0027unsafe-inline\u0027; style-src \u0027unsafe-inline\u0027; img-src data: blob:; font-src data:; connect-src data: blob:; worker-src blob:; media-src \u0027none\u0027; frame-src \u0027none\u0027; object-src \u0027none\u0027; form-action \u0027none\u0027; base-uri \u0027none\u0027">`;
const out = m[0] + csp + src.slice(m[0].length);
const file = "offline/Loss Dashboard (offline).html";
fs.writeFileSync(file, out);
console.log("wrote", file);
'
