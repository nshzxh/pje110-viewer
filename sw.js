/* PJE110 位置查看端 · 极简 Service Worker
 * 仅缓存本站静态资源；Gist / 高德请求走网络（不缓存，保证实时性） */
var CACHE = "opsec-viewer-v1";
var PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = e.request.url;
  // 实时数据源与地图瓦片不缓存，避免读到陈旧位置
  if (url.indexOf("gist.githubusercontent.com") !== -1 ||
      url.indexOf("api.github.com") !== -1 ||
      url.indexOf("webapi.amap.com") !== -1 ||
      url.indexOf("amap.com") !== -1) return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      });
    }).catch(function () { return caches.match("./index.html"); })
  );
});
