SenseRender
===========================

SenseRender is basically Prerender (a node server that uses Headless Chrome to render HTML, screenshots, PDFs, and HAR files out of any web page. The Prerender server listens for an http request, takes the URL and loads it in Headless Chrome, waits for the page to finish loading by waiting for the network to be idle, and then returns your content.) with a few modifications.

##### The quickest way to run our prerender server:

```bash
$ npm install
$ sh run start.sh
```

## Use case
The Prerender server is called from HAProxy, which then serves a static HTML SEO friendly page to the bot.

## How it works
This is a simple service that only takes a url and returns the rendered HTML (with all script tags removed).
Note: you should proxy the request through your server (using middleware) so that any relative links to CSS/images/etc still work.

An example: 
`GET https://service.prerender.io/https://www.google.com`

## Running locally
If you are running the prerender service locally for development purposes be sure to run the start.cmd script
Then open a browser: https://localhost:9030/https://www.thuis.nl/

That should send a request to the Prerender server and display the prerendered page through your website. If you View Source of that page, you should see the HTML with all of the `<script>` tags removed.

Good luck!
Nick from Sensemakers.

## Options

### logRequests
```
var prerender = require('./lib');

var server = prerender({
    logRequests: true
});

server.start();
```

Causes the Prerender server to print out every request made represented by a `+` and every response received represented by a `-`. Lets you analyze page load times.

`Default: false`

### pageDoneCheckInterval
```
var prerender = require('./lib');

var server = prerender({
    pageDoneCheckInterval: 1000
});

server.start();
```

Number of milliseconds between the interval of checking whether the page is done loading or not. You can also set the environment variable of `PAGE_DONE_CHECK_INTERVAL` instead of passing in the `pageDoneCheckInterval` parameter.

`Default: 500`

### pageLoadTimeout
```
var prerender = require('./lib');

var server = prerender({
    pageLoadTimeout: 20 * 1000
});

server.start();
```

Maximum number of milliseconds to wait while downloading the page, waiting for all pending requests/ajax calls to complete before timing out and continuing on. Time out condition does not cause an error, it just returns the HTML on the page at that moment. You can also set the environment variable of `PAGE_LOAD_TIMEOUT` instead of passing in the `pageLoadTimeout` parameter.

`Default: 20000`

### waitAfterLastRequest
```
var prerender = require('./lib');

var server = prerender({
    waitAfterLastRequest: 500
});

server.start();
```

Number of milliseconds to wait after the number of requests/ajax calls in flight reaches zero. HTML is pulled off of the page at this point. You can also set the environment variable of `WAIT_AFTER_LAST_REQUEST` instead of passing in the `waitAfterLastRequest` parameter.

`Default: 500`

### followRedirects
```
var prerender = require('./lib');

var server = prerender({
    followRedirects: false
});

server.start();
```

Whether Chrome follows a redirect on the first request if a redirect is encountered. Normally, for SEO purposes, you do not want to follow redirects. Instead, you want the Prerender server to return the redirect to the crawlers so they can update their index. Don't set this to `true` unless you know what you are doing. You can also set the environment variable of `FOLLOW_REDIRECTS` instead of passing in the `followRedirects` parameter.

`Default: false`

## Plugins

We use a plugin system in the same way that Connect and Express use middleware. Our plugins are a little different and we don't want to confuse the prerender plugins with the [prerender middleware](#middleware), so we opted to call them "plugins".

Plugins are in the `lib/plugins` directory, and add functionality to the prerender service.

Each plugin can implement any of the plugin methods:

#### `init()`

#### `requestReceived(req, res, next)`

#### `tabCreated(req, res, next)`

#### `pageLoaded(req, res, next)`

#### `beforeSend(req, res, next)`

## Available plugins

You can use any of these plugins by modifying the `server.js` file

### basicAuth

If you want to only allow access to your Prerender server from authorized parties, enable the basic auth plugin.

You will need to add the `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` environment variables.
```
export BASIC_AUTH_USERNAME=prerender
export BASIC_AUTH_PASSWORD=test
```

Then make sure to pass the basic authentication headers (password base64 encoded).

```
curl -u prerender:wrong http://localhost:3000/http://example.com -> 401
curl -u prerender:test http://localhost:3000/http://example.com -> 200
```

### removeScriptTags

We remove script tags because we don't want any framework specific routing/rendering to happen on the rendered HTML once it's executed by the crawler. The crawlers may not execute javascript, but we'd rather be safe than have something get screwed up.

For example, if you rendered the HTML of an angular page but left the angular scripts in there, your browser would try to execute the angular routing and possibly end up clearing out the HTML of the page.

This plugin implements the `pageLoaded` function, so make sure any caching plugins run after this plugin is run to ensure you are caching pages with javascript removed.

### httpHeaders

If your Javascript routing has a catch-all for things like 404's, you can tell the prerender service to serve a 404 to google instead of a 200. This way, google won't index your 404's.

Add these tags in the `<head>` of your page if you want to serve soft http headers. Note: Prerender will still send the HTML of the page. This just modifies the status code and headers being sent.

Example: telling prerender to server this page as a 404
```html
<meta name="prerender-status-code" content="404">
```

Example: telling prerender to serve this page as a 302 redirect
```html
<meta name="prerender-status-code" content="302">
<meta name="prerender-header" content="Location: https://www.google.com">
```

### whitelist

If you only want to allow requests to a certain domain, use this plugin to cause a 404 for any other domains.

You can add the whitelisted domains to the plugin itself, or use the `ALLOWED_DOMAINS` environment variable.

`export ALLOWED_DOMAINS=www.prerender.io,prerender.io`

### blacklist

If you want to disallow requests to a certain domain, use this plugin to cause a 404 for the domains.

You can add the blacklisted domains to the plugin itself, or use the `BLACKLISTED_DOMAINS` environment variable.

`export BLACKLISTED_DOMAINS=yahoo.com,www.google.com`

### in-memory-cache

Caches pages in memory. Available at [prerender-memory-cache](https://github.com/prerender/prerender-memory-cache)

### s3-html-cache

Caches pages in S3. Available at [coming soon](https://github.com/prerender/prerender)

--------------------

### <a id='prerendercom'></a>
# Prerender.com
###### For doing your own web crawling

When running your Prerender server in the web crawling context, we have a separate "API" for the server that is more complex to let you do different things like:
- get HTML from a web page
- get screenshots (viewport or full screen) from a web page
- get PDFS from a web page
- get HAR files from a web page
- execute your own javascript and return json along with the HTML

If you make an http request to the `/render` endpoint, you can pass any of the following options. You can pass any of these options as query parameters on a GET request or as JSON properties on a POST request. We recommend using a POST request but we will display GET requests here for brevity. Click here to see [how to send the POST request](#getvspost).

These examples assume you have the server running locally on port 3000 but you can also use our hosted service at [https://prerender.com/](https://prerender.com/).

#### url

The URL you want to load. Returns HTML by default.

```
http://localhost:3000/render?url=https://www.example.com/
```

#### renderType

The type of content you want to pull off the page.

```
http://localhost:3000/render?renderType=html&url=https://www.example.com/
```

Options are `html`, `jpeg`, `png`, `pdf`, `har`.

#### userAgent

Send your own custom user agent when Chrome loads the page.

```
http://localhost:3000/render?userAgent=ExampleCrawlerUserAgent&url=https://www.example.com/
```

#### fullpage

Whether you want your screenshot to be the entire height of the document or just the viewport.

```
http://localhost:3000/render?fullpage=true&renderType=html&url=https://www.example.com/
```

Don't include `fullpage` and we'll just screenshot the normal browser viewport. Include `fullpage=true` for a full page screenshot.

#### width

Screen width. Lets you emulate different screen sizes.

```
http://localhost:3000/render?width=990&url=https://www.example.com/
```

Default is `1440`.

#### height

Screen height. Lets you emulate different screen sizes.

```
http://localhost:3000/render?height=100&url=https://www.example.com/
```

Default is `718`.

#### followRedirects

By default, we don't follow 301 redirects on the initial request so you can be alerted of any changes in URLs to update your crawling data. If you want us to follow redirects instead, you can pass this parameter.

```
http://localhost:3000/render?followRedirects=true&url=https://www.example.com/
```

Default is `false`.

#### javascript

Execute javascript to modify the page before we snapshot your content. If you set `window.prerenderData` to an object, we will pull the object off the page and return it to you. Great for parsing extra data from a page in javascript.

```
http://localhost:3000/render?javascript=window.prerenderData=window.angular.version&url=https://www.example.com/
```

When using this parameter and `window.prerenderData`, the response from Prerender will look like:
```
{
	prerenderData: { example: 'data' },
	content: '<html><body></body></html>'
}
```

If you don't set `window.prerenderData`, the response won't be JSON. The response will just be the normal HTML.

### <a id='getvspost'></a>
### Get vs Post

You can send all options as a query parameter on a GET request or as a JSON property on a POST request. We recommend using the POST request when possible to avoid any issues with URL encoding of GET request query strings. Here's a few pseudo examples:

```
POST http://localhost:3000/render
{
	renderType: 'html',
	javascript: 'window.prerenderData = window.angular.version',
	url: 'https://www.example.com/'
}
```

```
POST http://localhost:3000/render
{
	renderType: 'jpeg',
	fullpage: 'true',
	url: 'https://www.example.com/'
}
```

Check out our [full documentation](https://prerender.com/documentation)


## License

The MIT License (MIT)

Copyright (c) 2013 Todd Hooper &lt;todd@prerender.io&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
