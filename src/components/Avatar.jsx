export default function Avatar({ player, className = '' }) {
  return (
    <svg className={`av ${className}`.trim()} viewBox="0 0 8 8" shapeRendering="crispEdges">
      <rect width="8" height="2" fill={player.hair} />
      <rect x="1" y="2" width="6" height="4" fill={player.skin} />
      <rect x="2" y="3" width="1" height="1" fill="#140a20" />
      <rect x="5" y="3" width="1" height="1" fill="#140a20" />
      <rect x="3" y="5" width="2" height="1" fill="#a05a3c" />
      <rect y="6" width="8" height="2" fill={player.shirt} />
    </svg>
  )
}
