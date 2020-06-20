import config from '../src/temp/config';
import PathParser from './pathparser';
import LayoutService from './layoutservice';
import { renderView } from '../build/server.bundle';

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false;

// Request prefixes that just need to be proxied through to origin
const ForwardedUrlPrefixes = [
  '/sitecore/api',
  '/api',
  '/layouts/',
  '/-/jssmedia',
  '/jss-render'
];

// If you are working locally, you need to tunnel your
// disconnected layout service service
// usage: ngrok http 3000
// The tunnel id it generates should be entered here.
config.sitecoreApiHost = config.originSitecoreApiHost;
config.graphQLEndpoint = config.originGraphQLEndpoint;

// Initialize helper classes for SSR
const pathParser = new PathParser(config);
const layoutService = new LayoutService(config);

/**
 * Main entry point for the service worker, handles worker requests.
 */
addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    let errorMessage = 'Internal Error';
    if (DEBUG) {
      errorMessage = e.message || e.toString();
    }
    event.respondWith(new Response(errorMessage, {status: 500}))
  }
})

/**
 * handleEvent processes and routes each worker request depending on it's type.
 */
async function handleEvent(event) {
  const url = new URL(event.request.url);

  let response = null;

  // Determine if this request should just be forwarded to origin
  const shouldBeForwarded = shouldForwardRequestToOrigin(url);

  if (shouldBeForwarded) {
    // Forward request to origin
    response = await handleForwardRequestToOrigin(url);
  } else {
    response = await handleRouteRequest(url);
  }

  return response;
}

function shouldForwardRequestToOrigin(url) {
  // Check the URL against the prefix array, also assume a URL with a period in it is an asset and needs to be forwarded.
  const shouldBeForwarded = ForwardedUrlPrefixes.find(prefix => url.pathname.startsWith(prefix)) || url.pathname.indexOf('.') > -1;
  return shouldBeForwarded;
}

async function handleRouteRequest(url) {
  // Parse the route and try to determine the language and item path
  const { path, language } = pathParser.parse(url);

  // Request associated layout service data for route
  const layoutRequest = layoutService.fetchRoute(path, language);

  // Request the dictionary data for this language
  const dictionaryRequest = layoutService.fetchDictionary(language);

  // Wait for the layout and dictionary requests to finish.
  const [layout, dictionary] = await Promise.all([layoutRequest, dictionaryRequest]);

  // Perform SSR with requested data by leveraging the renderView import from the server.bundle.
  return new Promise((resolve, reject) => {

      // Build a mock viewBag, add things here as needed.
      const viewBag = { dictionary };

      renderView((error, { html }) => {
        // If there is an error during SSR, reject and bubble up the error.
        if (error) {
          reject(error);
        } else {
          // Build the response object with the returned HTML from renderView.
          const response = new Response(html, { headers: { "Content-Type": "text/html" } })
          resolve(response)
        }
      }, path, layout, viewBag);

  });
}

async function handleForwardRequestToOrigin(url) {
  // Pull the origin URL from the configuration object, append the current path and query string to it
  const rewriteUrl = `${config.sitecoreApiHost}${url.pathname}${url.search}`;
  
  // Proxy request to origin
  const response = await fetch(rewriteUrl);
  let { readable, writable } = new TransformStream()
  response.body.pipeTo(writable);

  // Build response from origin response
  return new Response(readable, response);
}