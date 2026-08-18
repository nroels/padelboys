export default function UpdateToast({ onRefresh }) {
  return (
    <div className="updatetoast p2">
      <span>NEW VERSION AVAILABLE</span>
      <button type="button" onClick={onRefresh}>REFRESH</button>
    </div>
  )
}
