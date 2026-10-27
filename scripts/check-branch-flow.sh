#!/usr/bin/env bash
# Decides whether a pull request may target its base branch.
#   main  : only from a branch named UAT that lives in this repository (not a fork)
#   UAT   : anything goes, the gates job is the only requirement
# Exits 0 to allow, 1 to refuse, and says why on stdout.
set -eu

BASE="${BASE:-}"
HEAD="${HEAD:-}"
HEAD_REPO="${HEAD_REPO:-}"
THIS_REPO="${THIS_REPO:-}"

if [ -z "$BASE" ] || [ -z "$HEAD" ]; then
    echo "check-branch-flow: BASE and HEAD are required" >&2
    exit 2
fi

echo "flow: $HEAD (from ${HEAD_REPO:-unknown}) -> $BASE"

if [ "$BASE" != "main" ]; then
    echo "flow OK: only main has a source rule"
    exit 0
fi

if [ "$HEAD_REPO" != "$THIS_REPO" ]; then
    echo "flow REFUSED: main takes releases from this repository's UAT branch, not a fork ($HEAD_REPO)"
    exit 1
fi

if [ "$HEAD" != "UAT" ]; then
    echo "flow REFUSED: main only takes merges from UAT; this PR is $HEAD -> main."
    echo "Merge into UAT first, then open the release PR from UAT."
    exit 1
fi

echo "flow OK: UAT -> main"
