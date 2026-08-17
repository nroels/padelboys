const TABS = [
  { id: 'home', icon: '▦', label: 'HOME' },
  { id: 'matches', icon: '◉', label: 'MATCHES' },
  { id: 'log', icon: '+', label: null, plus: true },
  { id: 'stats', icon: '▲', label: 'STATS' },
  { id: 'account', icon: '☺', label: 'ACCOUNT' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav>
      {TABS.map((tab) => (
        <a
          key={tab.id}
          className={[tab.plus ? 'plus' : '', active === tab.id ? 'on' : ''].join(' ').trim()}
          onClick={() => onChange(tab.id)}
        >
          {tab.plus ? (
            <span className="plusbox p2">{tab.icon}</span>
          ) : (
            <>
              <span className="ic">{tab.icon}</span>
              {tab.label}
            </>
          )}
        </a>
      ))}
    </nav>
  )
}
