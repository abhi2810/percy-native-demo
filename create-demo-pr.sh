#!/bin/bash
trap "exit" INT TERM ERR
trap "kill 0" EXIT
set -e

if [ "$BROWSERSTACK_USERNAME" == "" ] || [ "$BROWSERSTACK_ACCESS_KEY" == "" ]; then
  echo 'Error: Please initialize environment variables BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY with your BrowserStack account username and access key, before running tests'
  exit 1
fi

# Check if app is uploaded if not then upload new app
var="$(curl -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" -X GET "https://api-cloud.browserstack.com/app-automate/recent_apps/PercyAndroid" 2>/dev/null)"
echo "$var"
if [[ "$var" =~ ^{.*}$ ]] || [ "$var" == "" ]; then
  echo "Uploading the App"
  curl -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  -X POST "https://api-cloud.browserstack.com/app-automate/upload" \
  -F "file=@./app/app.apk" \
  -F "custom_id=PercyAndroid"
fi

if ! [ -x "$(command -v hub)" ]; then
  echo 'Error: hub is not installed (https://hub.github.com/). Please run "brew install hub".' >&2
  exit 1
fi


NOW=`date +%d%H%M%S`
BASE_BRANCH="master-$NOW"
BRANCH="update-button-$NOW"
if [ "$CI_USER_ID" != "" ];
then
  BASE_BRANCH=${CI_USER_ID}_${BASE_BRANCH}
  BRANCH=${CI_USER_ID}_${BRANCH}
fi

# cd to current directory as root of script
cd "$(dirname "$0")"

mkdir -p images

# Create a "master-123123" branch for the PR's baseline.
# This allows demo PRs to be merged without fear of breaking the actual master.
git checkout master
git checkout -b $BASE_BRANCH
git push origin $BASE_BRANCH

# Create the update-button-123123 PR. It is always a fork of the update-button-base branch.
git checkout update-button-base
git checkout -b $BRANCH
git commit --amend -m 'Change Sign Up button style.'
git push origin $BRANCH
PR_NUM=$(hub pull-request -b $BASE_BRANCH -m 'Change Sign Up button style.' | grep -oE '/[0-9]+')

export PERCY_BRANCH=$BRANCH
export PERCY_PULL_REQUEST=${PR_NUM:1}

npx http-server -p 5162 &

npm test
npx percy upload ./images

# Create the fake "ci/service: Tests passed" notification on the PR.
# Uses a personal access token (https://github.com/settings/tokens) which has scope "repo:status".
curl \
  -u $GITHUB_USER:$GITHUB_TOKEN \
  -d '{"state": "success", "target_url": "https://example.com/build/status", "description": "Tests passed", "context": "ci/service"}' \
  "https://api.github.com/repos/BrowserStackCE/percy-demo/statuses/$(git rev-parse --verify HEAD)"

git checkout master
git branch -D $BASE_BRANCH
git branch -D $BRANCH

jobs
kill %1
wait