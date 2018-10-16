#!/usr/bin/env node

'use strict';

const fs     = require( 'fs' );
const github = require( '@octokit/rest' );
const path   = require( 'path' );

function getFullPath( filename ) {
	return path.join( __dirname, '..', filename );
}

const config = require( '../config.json' );

config.message = fs.readFileSync( getFullPath( 'MESSAGE.md' ), 'utf8' );
config.firstIssueNumber = config.firstIssueNumber || 0;

if (
	! config.username ||
	! config.apiToken ||
	! config.owner ||
	! config.repo ||
	! config.message
) {
	throw new Exception( 'One or more required configuration values are missing.' );
}

const gh = new github( {
	version : '3.0.0',
} );

gh.authenticate( {
	type  : 'oauth',
	token : config.apiToken,
} );

let issuesProcessed = {};

try {
	issuesProcessed = require( '../processed.json' );
} catch ( err ) {
	// The file hasn't been created yet; no problem
}

function processIssuesPage( pageNumber, issuesToComment ) {
	console.log( 'Getting page %d of open issues...', pageNumber );
	gh.issues.getForRepo( {
		owner    : config.owner,
		repo     : config.repo,
		page     : pageNumber,
		per_page : 100,
	}, ( err, res ) => {
		if ( err ) {
			throw err;
		}
		let issues = res.data;
		if ( config.type === 'issues' ) {
			issues = issues.filter( issue => ! issue.pull_request );
		} else if ( config.type === 'pulls' ) {
			issues = issues.filter( issue => !! issue.pull_request );
		}
		if ( config.author ) {
			issues = issues.filter( issue => issue.user.login === config.author );
		}
		const toCommentThisPage = issues.filter( issue => {
			if ( issue.number < config.firstIssueNumber ) {
				return false;
			}
			if ( issuesProcessed[ issue.number ] ) {
				console.log(
					'Ignoring issue/PR %d ("%s")',
					issue.number,
					issue.title
				);
				return false;
			}
			return true;
		} );
		console.log(
			'Issues/PRs: %d; to comment: %d',
			issues.length,
			toCommentThisPage.length
		);
		issuesToComment = issuesToComment.concat( toCommentThisPage );
		if ( gh.hasNextPage( res ) ) {
			processIssuesPage( pageNumber + 1, issuesToComment );
		} else {
			commentOnIssues( issuesToComment );
		}
	} );
}

function commentOnIssues( issues ) {
	if ( ! issues.length ) {
		return;
	}
	const issue = issues[ 0 ];
	let message = config.message;
	gh.issues.createComment( {
		owner  : config.owner,
		repo   : config.repo,
		number : issue.number,
		body   : message,
	}, ( err, res ) => {
		if ( err ) {
			throw err;
		}
		issuesProcessed[ issue.number ] = {
			title : issue.title,
			date  : new Date().toString(),
		};
		fs.writeFileSync(
			getFullPath( 'processed.json' ),
			JSON.stringify( issuesProcessed, null, 4 ) + '\n'
		);
		console.log(
			'Commented on issue/PR %d ("%s")',
			issue.number,
			issue.title
		);
		commentOnIssues( issues.slice( 1 ) );
	} );
}

processIssuesPage( 1, [] );
