const CACHE_NAME = "rollcall-v1"
const STATIC_ASSETS = ["/", "/index.html"]

// Install: cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET and Supabase API calls
  if (event.request.method !== "GET" || url.hostname.includes("supabase")) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response.ok && (url.pathname.match(/\.(js|css|woff2?|svg|png|ico)$/) || url.pathname === "/")) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request).then(
          (cached) => cached || caches.match("/index.html")
        )
      })
  )
})

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || "RollCall Reminder", {
      body: data.body || "Don't forget to log today's attendance!",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
    })
  )
})
