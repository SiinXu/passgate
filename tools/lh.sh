#!/bin/bash
# usage: lh.sh <outdir>
OUT=$1; mkdir -p $OUT
LH=/workspace/tools/lh/node_modules/.bin/lighthouse
export CHROME_PATH=/usr/bin/google-chrome
for p in home:/ template:/template.html; do
  n=${p%%:*}; path=${p#*:}
  for ff in mobile desktop; do
    extra=""; [ $ff = desktop ] && extra="--preset=desktop"
    $LH "https://passgate.incidental.site$path" $extra --output=json --output-path=$OUT/$n-$ff.json --quiet --chrome-flags="--headless=new --no-sandbox" >/dev/null 2>&1
    node -e "const r=require('$OUT/$n-$ff.json');const c=r.categories;console.log('$n-$ff',Object.values(c).map(x=>x.id+':'+Math.round(x.score*100)).join(' '))"
  done
done
