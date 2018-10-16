# The Commenter

This is a bot that automatically leaves comments on new GitHub issues and/or PRs.

## Installation

First, make sure you have Node.js installed (tested on version 10.12.0).

Then:

```
git clone https://github.com/nylen/the-commenter.git
cd the-commenter
npm install
cp sample-config.json config.json
```

Then fill in the values in `config.json`.

## Configuration

- `username`: Your GitHub username.
- `apiToken`: Your [GitHub API token](https://github.com/settings/tokens).
- `owner`: The owner of the repository where you want to comment on issues.
- `repo`: The name of the repository where you want to comment on issues.
- _(optional)_ `type`: Comment on `issues` or `pulls` only.
- _(optional)_ `author`: Comment on issues/PRs by this author only.
- _(optional)_ `firstIssueNumber`: Only comment on issues with this issue
  number or higher.

For the message to use when leaving a comment, the plugin will read a file
called `MESSAGE.md` in the same directory as the config file.

## Usage


```sh
node bin/the-commenter.js
```

I recommend setting this to run using a cron job, e.g. every 5 minutes.
