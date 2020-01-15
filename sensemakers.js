#!/usr/bin/env node

const resourceBlockEnabled = process.env.BLOCK_RESOURCES || 1
const scriptsEnabled = process.env.ENABLE_SCRIPTS || 0
const cacheEnabled = process.env.SENSEMAKERS_CACHE_ENABLED || 0
const logEnabled = process.env.SENSEMAKERS_APACHE_ACCESS_LOG_ENABLED || 0

const os = require('os');
const nix = (os.platform() == 'win32') ? false : true;

var prerender = require('./lib');

const chromeLocation = (nix) ? '/usr/lib/chromium-browser/chromium-browser' : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const server = prerender({
        port: process.env.PORT || 9030,
        chromeLocation: chromeLocation
});

server.use(prerender.sendPrerenderHeader());

if (resourceBlockEnabled == 1)
    server.use(require('prerender-senseblock'));

if (scriptsEnabled == 0)
    server.use(prerender.removeScriptTags());

server.use(prerender.httpHeaders());

if (cacheEnabled == 1)
    server.use(require('prerender-sensecache'));

if (logEnabled == 1)
    server.use(require('prerender-senselog'));

server.start();