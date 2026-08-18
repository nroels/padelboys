import { speciesArt } from '../lib/avatars.js'

export default function Avatar({ player, className = '' }) {
  const rects = speciesArt(player.species, player)
  return (
    <svg className={`av ${className}`.trim()} viewBox="0 0 8 8" shapeRendering="crispEdges">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
      <rect y="6" width="8" height="2" fill={player.accent} />
    </svg>
  )
}
