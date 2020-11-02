# Gamertag Checker

Allows you to check the availability of many Xbox Live gamertags at once.

## Getting started

First need to install dependencies by running `npm install`.

Then create a `.env` file by running `cp sample.env .env` and filling out the auth token value in that file. You can retrieve this auth token value by visiting the [Official XBL Change Gamertag webpage](https://social.xbox.com/changegamertag), making a dummy request using the form and inspecting the network requests for `/reserve`. The auth token value should be listed in the `authorization` request header and begin with something like `XBL3.0 x=...`. Copy and paste the entire authorization header value into the `.env` file.

Once configured with your auth token, you can fill out the `input.txt` file with the gamertags you wish to check. Enter one gamertag per line, without quotes.

Finally, run `npm run start` and wait until completion, you should see the results pop into the console and appear in the `output.txt` file.
