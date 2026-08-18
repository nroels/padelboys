// sw.js calls skipWaiting()+clientsClaim() so a new service worker takes
// control the moment it activates, but the open tab keeps running the old
// JS bundle until it reloads. Reload once when control changes so users
// always land on the version the new worker is serving.
export function watchForUpdates() {
  if (!('serviceWorker' in navigator)) return

  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  })
}

// Browsers only check sw.js for changes on navigation, which rarely happens
// in an installed PWA. Force the check whenever the app comes back to the
// foreground so updates are picked up promptly instead of sitting cached.
export async function checkForUpdate() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  registration?.update()
}
