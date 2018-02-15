# gocd-encrypt-cli

Tool for encrypting values with the GOCD encryption API via the CLI for insertion into GOCD yml config files.

## Installation

`npm i -g gocd-encrypt`

Create .go-credentials configuration file in either your user's home directory, or the Current Working Directory where you wish to save the config files to.

`{
  "host": "https://gocd.my.domain",
  "username": "my-username",
  "password": "my-password"
}`

The go user credentials will require API access to function correctly.

## Usage
