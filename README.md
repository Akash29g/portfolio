# feat: hire Akash Goswami

My portfolio, built as a GitHub-style pull request for the AWS Student Builder Challenge. The visitor is the reviewer, the tabs are Conversation (About), Files changed (Skills), Commits (Projects) and Checks (Achievements).

**Creative feature:** the pulsing "Merge pull request" button (and a kart game, Pipeline Grand Prix, to race for it). Merging runs a fake git merge, fires confetti and starts an AWS Step Functions workflow.

## AWS services
Amplify Hosting, CloudFront, API Gateway (HTTP API), Lambda, Amazon Bedrock (Ask the reviewer), Step Functions Express, DynamoDB, SES (contact form), SNS (merge notification). Backend is a SAM template in `backend/`.

## Structure
- `index.html`, `aws.html`, `open-source.html`, `race.html`, `ask.html`, `blog.html`, `resume.html`, `contact.html`, `404.html`, `projects/docanalytics.html`
- `style.css`, `config.js` (API URL), `backend/` (template.yaml, src/app.mjs), `deploy.sh`

## Fun bits
Press `/` for a terminal, try the Konami code, click any diff line to leave a review comment.
