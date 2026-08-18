import { useState } from 'react'
import Avatar from './Avatar.jsx'
import { isAdmin } from '../lib/nights.js'

const ADMIN_PASSWORD = 'padel'

export default function Onboarding({ stage, players, onPwaContinue, onPick }) {
  const [lockedPick, setLockedPick] = useState(null)
  const [password, setPassword] = useState('')
  const [wrongPassword, setWrongPassword] = useState(false)

  function handleAvatarPick(p) {
    if (isAdmin(p)) {
      setLockedPick(p)
      setWrongPassword(false)
      setPassword('')
    } else {
      onPick(p.id)
    }
  }

  function handleUnlock(e) {
    e.preventDefault()
    if (password.toLowerCase() === ADMIN_PASSWORD) {
      onPick(lockedPick.id)
    } else {
      setWrongPassword(true)
      setPassword('')
    }
  }

  return (
    <div className="ob on">
      <div className="starfield">
        <div className="stars s1"></div>
        <div className="stars s2"></div>
      </div>
      {stage === 'pwa' ? (
        <>
          <div className="obtitle p2">
            GET THE
            <br />
            FULL EXPERIENCE
          </div>
          <div className="box">
            <div className="steps">
              1. TAP <b>⊞ SHARE</b> IN SAFARI
              <br />
              2. PICK <b>ADD TO HOME SCREEN</b>
            </div>
            <div className="obnote">needed for notifications · shown once</div>
          </div>
          <div className="obrow">
            <button className="shuf" onClick={onPwaContinue}>DONE</button>
            <button className="shuf ghost" onClick={onPwaContinue}>LATER</button>
          </div>
        </>
      ) : (
        <>
          <div className="obtitle p2">WHO ARE YOU?</div>
          <div className="box">
            {lockedPick ? (
              <form onSubmit={handleUnlock}>
                <div className="me">
                  <Avatar player={lockedPick} />
                </div>
                <div className="obnote" style={{ marginBottom: 10 }}>
                  ENTER PASSWORD FOR {lockedPick.name}
                </div>
                <input
                  className="pxinput"
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {wrongPassword && <div className="obnote" style={{ color: 'var(--pink)' }}>WRONG PASSWORD</div>}
                <div className="obrow">
                  <button type="submit" className="shuf">UNLOCK</button>
                  <button type="button" className="shuf ghost" onClick={() => setLockedPick(null)}>BACK</button>
                </div>
              </form>
            ) : (
              <div className="whogrid">
                {players.map((p) => (
                  <button key={p.id} onClick={() => handleAvatarPick(p)}>
                    <Avatar player={p} />
                    <div className="nm p2">{p.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
