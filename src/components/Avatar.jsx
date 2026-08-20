import { speciesArt } from '../lib/avatars.js'
import { avatarToRects, isValidAvatar } from '../lib/pixels.js'

// Players who have drawn an avatar render from that; everyone else still falls
// back to their fixed species art, so an un-backfilled row never renders blank.
export default function Avatar({ player, className = '' }) {
  const rects = isValidAvatar(player.avatar)
    ? avatarToRects(player.avatar)
    : speciesArt(player.species, player)
  return (
    <svg className={`av ${className}`.trim()} viewBox="0 0 8 8" shapeRendering="crispEdges">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
      <rect y="6" width="8" height="2" fill={player.accent} />
    </svg>
  )
}
