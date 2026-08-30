import { Component } from 'react'

// React 18 unmounts the whole tree on an uncaught render error, which leaves
// the bare purple body with nothing on it. Catch it here so the user gets a
// reload button instead of a blank screen.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('render crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="ob on">
        <div className="obtitle p2">GAME OVER</div>
        <div className="box">
          <div className="obnote">something broke while drawing the screen</div>
          <div className="obrow">
            <button className="shuf" onClick={() => window.location.reload()}>RELOAD</button>
          </div>
        </div>
      </div>
    )
  }
}
