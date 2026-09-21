"use strict";
var CACHE = "99stayqs-v4";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){ return cache.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

/* network-first for navigations (so a fresh deploy is picked up when online),
   cache-first for everything else, always falling back to cache when offline */
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;

  if(e.request.mode === "navigate"){
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(cache){ cache.put(e.request, copy); });
        return res;
      }).catch(function(){
        return caches.match(e.request).then(function(cached){ return cached || caches.match("./index.html"); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(cache){ cache.put(e.request, copy); });
        return res;
      }).catch(function(){ return cached; });
    })
  );
});
