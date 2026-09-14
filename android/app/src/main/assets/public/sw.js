/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d6b8b9dbea3e6db646779f4591948d64"
  }, {
    "url": "pwa-512x512.png",
    "revision": "e057dd4e3996485d5a7462df3ba809a3"
  }, {
    "url": "pwa-192x192.png",
    "revision": "1511693bbc45bb534e7f208fb4c4f5b6"
  }, {
    "url": "index.html",
    "revision": "0db9218ab7f193744c022ec9ac4a9f53"
  }, {
    "url": "icon.svg",
    "revision": "0f47442c92a029548471cf823667a600"
  }, {
    "url": "favicon.ico",
    "revision": "ae714ba4a5d574d9407a55192dc45f43"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "79180adf4a48aa3ef76a8d2824027075"
  }, {
    "url": "assets/index-DUkoGsxQ.css",
    "revision": null
  }, {
    "url": "assets/index-BcIRMH3-.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "79180adf4a48aa3ef76a8d2824027075"
  }, {
    "url": "favicon.ico",
    "revision": "ae714ba4a5d574d9407a55192dc45f43"
  }, {
    "url": "icon.svg",
    "revision": "0f47442c92a029548471cf823667a600"
  }, {
    "url": "pwa-192x192.png",
    "revision": "1511693bbc45bb534e7f208fb4c4f5b6"
  }, {
    "url": "pwa-512x512.png",
    "revision": "e057dd4e3996485d5a7462df3ba809a3"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d6b8b9dbea3e6db646779f4591948d64"
  }, {
    "url": "manifest.webmanifest",
    "revision": "3e166b1cdb009d85a418f5ef8f5fa576"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
