// sw.js calls skipWaiting()+clientsClaim() so a new service worker takes
// control the moment it activates, but the open tab keeps running the old
// JS bundle until it reloads. Rather than reloading out from under the
// user mid-action, let the caller show a "refresh to update" prompt.
export function watchForUpdates(onUpdateAvailable) {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.addEventListener('controllerchange', onUpdateAvailable, { once: true })
}

// Browsers only check sw.js for changes on navigation, which rarely happens
// in an installed PWA. Force the check whenever the app comes back to the
// foreground so updates are picked up promptly instead of sitting cached.
export async function checkForUpdate() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  registration?.update()
}
