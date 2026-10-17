#!/usr/bin/env bash
# ponytail: ОДИН аргумент — base URL. Повертає 0 коли все проходить.
# Routes: головна, sitemap.xml, robots.txt, /q, /go, /k1, /47, /tools/qr-studio/, /tourist-tax/, /privacy
# POST /api/funnel/leads має повернути 503 без справжнього вебхука (чесна відмова) або 400/422 за валідацією.
set -euo pipefail

BASE="${1:-http://127.0.0.1:8080}"
HOST_HEADER="${HOST_HEADER:-}"
FAIL=0
UA="vdalo-smoke/1 (+ops@vdalo.tech)"

curl_opts=(-sS -m 10 -A "$UA" -o /dev/null -w "%{http_code} %{size_download} %{content_type}\n")
[[ -n "$HOST_HEADER" ]] && curl_opts+=(-H "Host: $HOST_HEADER")

check_get() {
  local path="$1" min="$2" max="$3" ct_grep="$4"
  local out
  if ! out=$(curl "${curl_opts[@]}" "$BASE$path"); then
    echo "FAIL  GET $path  curl error"; FAIL=1; return
  fi
  local code size ct
  code=${out%% *}; rest=${out#* }; size=${rest%% *}; ct=${rest#* }
  if (( code < 200 || code >= 400 )); then echo "FAIL  GET $path  $code $size $ct"; FAIL=1; return; fi
  if (( size < min )); then echo "FAIL  GET $path  size $size < $min"; FAIL=1; return; fi
  if [[ -n "$max" ]] && (( size > max )); then echo "FAIL  GET $path  size $size > $max"; FAIL=1; return; fi
  if [[ -n "$ct_grep" ]] && [[ "$ct" != *"$ct_grep"* ]]; then echo "FAIL  GET $path  ct=$ct"; FAIL=1; return; fi
  echo "ok    GET $path  $code $size"
}

check_opts() {
  local path="$1"
  local code
  code=$(curl -sS -m 10 -A "$UA" -o /dev/null -w "%{http_code}" -X OPTIONS -H "Origin: https://www.vdalo.tech" "$BASE$path")
  if (( code < 200 || code >= 500 )); then echo "FAIL  OPTS $path  $code"; FAIL=1; return; fi
  echo "ok    OPTS $path  $code"
}

check_funnel_post() {
  # Will submit a dummy payload; without a real webhook configured, server replies 503.
  local path="/api/funnel/leads"
  local code
  code=$(curl -sS -m 10 -A "$UA" -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" -H "Origin: $BASE" \
    --data '{"name":"smoke","contact":"test@example.com","consent":true}' "$BASE$path")
  case "$code" in
    503|400|422|403|415) echo "ok    POST $path  $code (expected honest fail)";;
    200)                 echo "ok    POST $path  200 (webhook configured)";;
    *) echo "FAIL  POST $path  $code"; FAIL=1;;
  esac
}

check_get "/"                    5000  ""        "text/html"
check_get "/sitemap.xml"          200  ""        "xml"
check_get "/robots.txt"            10  ""        "text"
check_get "/q"                   1000  ""        "text/html"
check_get "/go"                   500  ""        "text/html"
check_get "/k1"                   500  ""        "text/html"
check_get "/47"                   500  ""        "text/html"
check_get "/tools/qr-studio/"    1000  ""        ""
check_get "/tourist-tax/"        1000  ""        "text/html"
check_get "/privacy"             1000  ""        "text/html"
check_opts "/api/funnel/leads"
check_funnel_post

exit $FAIL
