import Avatar from './Avatar.jsx'

export default function Onboarding({ stage, players, onPwaContinue, onPick }) {
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
            <div className="whogrid">
              {players.map((p) => (
                <button key={p.id} onClick={() => onPick(p.id)}>
                  <Avatar player={p} />
                  <div className="nm p2">{p.name}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
