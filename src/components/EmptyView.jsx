export default function EmptyView({ title, note }) {
  return (
    <section>
      <div className="box soon">
        <div className="big p2">{title}</div>
        {note}
      </div>
    </section>
  )
}
