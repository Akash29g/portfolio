#!/bin/bash
# usage: bash deploy.sh https://main.xxxx.amplifyapp.com
set -e
ORIGIN="$1"; EMAIL="akash29goswami@gmail.com"
[ -z "$ORIGIN" ] && { echo "Give your Amplify URL as the first argument"; exit 1; }
export PATH="$PATH:$HOME/.local/bin"
command -v sam >/dev/null || pip install --user aws-sam-cli
aws sesv2 create-email-identity --email-identity "$EMAIL" --region us-east-1 || true
cd backend
sam build
sam deploy --stack-name akash-portfolio-api --region us-east-1 --resolve-s3 --capabilities CAPABILITY_IAM --no-confirm-changeset --no-fail-on-empty-changeset --parameter-overrides OwnerEmail=$EMAIL AllowedOrigin=$ORIGIN
API=$(aws cloudformation describe-stacks --stack-name akash-portfolio-api --region us-east-1 --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
cd ..
echo "const API_URL=\"$API\";" > config.js
git add config.js && git commit -m "feat: connect API" && git push
echo "DONE. API: $API"
