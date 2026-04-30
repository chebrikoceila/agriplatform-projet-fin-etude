self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Alerte agronomique";
  const options = {
    body: data.body || "Nouvelle alerte detectee sur vos parcelles.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: data.data || { url: "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(targetUrl));
});
