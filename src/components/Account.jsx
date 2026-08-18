import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import { sanitizeUsername } from '../lib/identity.js'
import { getPushSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push.js'

const SAVE_DEBOUNCE_MS = 500

export default function Account({ me, onRename, onSwitchPlayer }) {
  const [name, setName] = useState(me?.name ?? '')
  const [message, setMessage] = useState('')
  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushNote, setPushNote] = useState('')
  const saveTimer = useRef(null)

  useEffect(() => {
    setName(me?.name ?? '')
    setMessage('')
    clearTimeout(saveTimer.current)
  }, [me?.id])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  useEffect(() => {
    if (!isPushSupported()) return
    getPushSubscription().then((sub) => setPushOn(sub !== null))
  }, [me?.id])

  if (!me) return null

  async function handleTogglePush() {
    setPushBusy(true)
    setPushNote('')
    try {
      if (pushOn) {
        await unsubscribeFromPush()
        setPushOn(false)
      } else {
        await subscribeToPush(me.id)
        setPushOn(true)
      }
    } catch (err) {
      console.error('failed to toggle push notifications', err)
      setPushNote('★ COULD NOT ENABLE — CHECK PERMISSIONS')
    } finally {
      setPushBusy(false)
    }
  }

  function handleChange(e) {
    const next = sanitizeUsername(e.target.value)
    setName(next)
    clearTimeout(saveTimer.current)
    if (next.length === 0) return
    saveTimer.current = setTimeout(() => {
      onRename(next).then((ok) => setMessage(ok ? '★ SAVED' : '★ NAME TAKEN'))
    }, SAVE_DEBOUNCE_MS)
  }

  return (
    <>
      <section>
        <h2 className="p2">ACCOUNT</h2>
        <div className="box">
          <div className="me">
            <Avatar player={me} />
          </div>
          <div className="hint">USERNAME (max 9):</div>
          <input
            className="pxinput p2"
            maxLength={9}
            spellCheck="false"
            autoComplete="off"
            value={name}
            onChange={handleChange}
          />
          <div className="note">{message}</div>
        </div>
      </section>
      <section>
        <h2 className="p2">NOTIFICATIONS</h2>
        <div className="box">
          {isPushSupported() ? (
            <>
              <button className="shuf ghost" onClick={handleTogglePush} disabled={pushBusy}>
                🔔 NOTIFICATIONS: {pushOn ? 'ON' : 'OFF'}
              </button>
              <div className="note">{pushNote}</div>
            </>
          ) : (
            <div className="note">add to home screen to enable notifications</div>
          )}
        </div>
      </section>
      <section>
        <h2 className="p2">PLAYER</h2>
        <div className="box">
          <button className="shuf ghost" onClick={onSwitchPlayer}>⇄ SWITCH PLAYER</button>
        </div>
      </section>
    </>
  )
}
