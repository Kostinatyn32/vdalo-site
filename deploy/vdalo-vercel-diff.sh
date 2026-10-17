#!/usr/bin/env bash
# ponytail: вкладає всі маршрути з Vercel-sitemap і статичні /1..59, /k1..k5 тощо;
# тягне кожен з Vercel і з нового сервера, порівнює status/Content-Type/canonical/розмір (±5%).
# Різниця — у звіт. Нічого не змінює.
set -euo pipefail

NEW_HOST="${NEW_HOST:-new.vdalo.tech}"
NEW_IP="${NEW_IP:-178.104.154.106}"
PROD="https://www.vdalo.tech"
UA="vdalo-diff/1 (+ops@vdalo.tech)"

TMP=$(mktemp -d); trap "rm -rf $TMP" EXIT

echo "== fetching Vercel sitemap =="
curl -sS -m 20 -A "$UA" "$PROD/sitemap.xml" >"$TMP/sitemap.xml"
mapfile -t SITEMAP_ROUTES < <(grep -oP '<loc>[^<]+' "$TMP/sitemap.xml" | sed 's#<loc>##; s#https://www.vdalo.tech##')

# Extra routes known from the comparison versions (/1..59, /k1..k5, /q, /go, /funnel, tools, tourist-tax).
EXTRA=(/q /go /funnel /tools/qr-studio/ /tourist-tax/ /privacy /offer /refunds)
for i in $(seq 1 59); do EXTRA+=("/$i"); done
for i in 1 2 3 4 5; do EXTRA+=("/k$i"); done

ROUTES=("${SITEMAP_ROUTES[@]}" "${EXTRA[@]}")

printf "%-50s %-6s %-6s %-20s %-7s %-7s %s\n" ROUTE STATUS vSTAT CT size% canon diff
printf '%.0s-' {1..110}; echo

mismatch=0
for route in "${ROUTES[@]}"; do
  [[ -z "$route" ]] && continue
  pv=$(curl -sS -m 20 -A "$UA" -o "$TMP/v.html" -w "%{http_code} %{size_download} %{content_type}" "$PROD$route" || echo "000 0 ")
  pn=$(curl -sS -m 20 -A "$UA" --resolve "$NEW_HOST:443:$NEW_IP" --resolve "$NEW_HOST:80:$NEW_IP" \
         -o "$TMP/n.html" -w "%{http_code} %{size_download} %{content_type}" "https://$NEW_HOST$route" || echo "000 0 ")

  v_code=${pv%% *}; v_rest=${pv#* }; v_size=${v_rest%% *}; v_ct=${v_rest#* }
  n_code=${pn%% *}; n_rest=${pn#* }; n_size=${n_rest%% *}; n_ct=${n_rest#* }

  v_canon=$(grep -oiP '<link[^>]+rel="canonical"[^>]+href="\K[^"]+' "$TMP/v.html" 2>/dev/null | head -1)
  n_canon=$(grep -oiP '<link[^>]+rel="canonical"[^>]+href="\K[^"]+' "$TMP/n.html" 2>/dev/null | head -1)

  size_pct=0
  if (( v_size > 0 )); then size_pct=$(( (n_size - v_size) * 100 / v_size )); fi
  (( size_pct < 0 )) && abs=$(( -size_pct )) || abs=$size_pct

  diff=""
  [[ "$v_code" != "$n_code" ]] && diff+="status "
  [[ "${v_ct%;*}" != "${n_ct%;*}" ]] && diff+="ct "
  [[ "$v_canon" != "$n_canon" ]] && diff+="canon "
  (( abs > 5 )) && diff+="size>5% "

  if [[ -n "$diff" ]]; then mismatch=$((mismatch+1)); fi
  printf "%-50s %-6s %-6s %-20s %5s%% %-7s %s\n" "$route" "$n_code" "$v_code" "${n_ct%;*}" "$size_pct" "$([[ "$v_canon" == "$n_canon" ]] && echo same || echo differs)" "$diff"
done

echo
echo "Routes with differences: $mismatch of ${#ROUTES[@]}"
exit $(( mismatch > 0 ))
