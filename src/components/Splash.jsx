export default function Splash({ onStart }) {
  return (
    <div id="splash" onClick={onStart}>
      <div className="s-logo p2">
        PADEL<br /><span>BOYS</span>
      </div>
      <div className="rackets">
        <svg className="rk l" viewBox="0 0 12 16">
          <rect x="2" y="1" width="8" height="8" fill="#55206b" />
          <rect x="3" y="0" width="6" height="1" fill="#ffe9cf" />
          <rect x="3" y="9" width="6" height="1" fill="#ffe9cf" />
          <rect x="1" y="2" width="1" height="6" fill="#ffe9cf" />
          <rect x="10" y="2" width="1" height="6" fill="#ffe9cf" />
          <rect x="2" y="1" width="1" height="1" fill="#ffe9cf" />
          <rect x="9" y="1" width="1" height="1" fill="#ffe9cf" />
          <rect x="2" y="8" width="1" height="1" fill="#ffe9cf" />
          <rect x="9" y="8" width="1" height="1" fill="#ffe9cf" />
          <rect x="4" y="3" width="1" height="1" fill="#140a20" />
          <rect x="7" y="3" width="1" height="1" fill="#140a20" />
          <rect x="4" y="6" width="1" height="1" fill="#140a20" />
          <rect x="7" y="6" width="1" height="1" fill="#140a20" />
          <rect x="5" y="10" width="2" height="6" fill="#ffe9cf" />
        </svg>
        <svg className="rk r" viewBox="0 0 12 16">
          <rect x="2" y="1" width="8" height="8" fill="#0a5c54" />
          <rect x="3" y="0" width="6" height="1" fill="#ffb03a" />
          <rect x="3" y="9" width="6" height="1" fill="#ffb03a" />
          <rect x="1" y="2" width="1" height="6" fill="#ffb03a" />
          <rect x="10" y="2" width="1" height="6" fill="#ffb03a" />
          <rect x="2" y="1" width="1" height="1" fill="#ffb03a" />
          <rect x="9" y="1" width="1" height="1" fill="#ffb03a" />
          <rect x="2" y="8" width="1" height="1" fill="#ffb03a" />
          <rect x="9" y="8" width="1" height="1" fill="#ffb03a" />
          <rect x="4" y="3" width="1" height="1" fill="#140a20" />
          <rect x="7" y="3" width="1" height="1" fill="#140a20" />
          <rect x="4" y="6" width="1" height="1" fill="#140a20" />
          <rect x="7" y="6" width="1" height="1" fill="#140a20" />
          <rect x="5" y="10" width="2" height="6" fill="#ffb03a" />
        </svg>
        <div className="s-ball"></div>
      </div>
      <div className="press p2">PRESS START</div>
      <div className="starfield">
        <div className="stars s1"></div>
        <div className="stars s2"></div>
      </div>
    </div>
  )
}
