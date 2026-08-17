import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import { sanitizeUsername } from '../lib/identity.js'

const SAVE_DEBOUNCE_MS = 500

export default function Account({ me, onRename, onSwitchPlayer }) {
  const [name, setName] = useState(me?.name ?? '')
  const [message, setMessage] = useState('')
  const saveTimer = useRef(null)

  useEffect(() => {
    setName(me?.name ?? '')
    setMessage('')
    clearTimeout(saveTimer.current)
  }, [me?.id])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  if (!me) return null

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
          <div className="hint">USERNAME (max 6):</div>
          <input
            className="pxinput p2"
            maxLength={6}
            spellCheck="false"
            autoComplete="off"
            value={name}
            onChange={handleChange}
          />
          <div className="note">{message}</div>
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
