import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@fillmatic/ui'

import './styles.css'

const App = () => {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [lateFieldVisible, setLateFieldVisible] = useState(false)
  const [framework, setFramework] = useState('')
  const [editorValue, setEditorValue] = useState('')

  useEffect(() => {
    const host = document.querySelector('#shadow-host')
    if (!(host instanceof HTMLElement) || host.shadowRoot) return

    const root = host.attachShadow({ mode: 'open' })
    const label = document.createElement('label')
    label.htmlFor = 'shadow-city'
    label.textContent = 'City inside an open shadow root'

    const input = document.createElement('input')
    input.id = 'shadow-city'
    input.name = 'city'
    input.autocomplete = 'address-level2'

    root.append(label, input)
  }, [])

  return (
    <main>
      <h1>Real-browser autofill fixture</h1>
      <p id="demo-status" role="status">
        Ready for FillMatic
      </p>
      <form name="framework-controlled">
        <label htmlFor="first-name">First name</label>
        <input
          id="first-name"
          name="firstName"
          autoComplete="given-name"
          value={firstName}
          onFocus={() => setLateFieldVisible(true)}
          onChange={(event) => setFirstName(event.currentTarget.value)}
        />
        <output data-testid="first-name-state">{firstName}</output>

        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
        <output data-testid="email-state">{email}</output>

        {lateFieldVisible && (
          <>
            <label htmlFor="late-company">Late-mounted company</label>
            <input id="late-company" name="company" autoComplete="organization" />
          </>
        )}

        <label id="framework-label">Framework</label>
        <Select value={framework} onValueChange={setFramework}>
          <SelectTrigger aria-labelledby="framework-label" data-testid="radix-trigger">
            <SelectValue placeholder="Choose a framework" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="react">React</SelectItem>
            <SelectItem value="vue">Vue</SelectItem>
            <SelectItem value="svelte">Svelte</SelectItem>
          </SelectContent>
        </Select>
        <output data-testid="framework-state">{framework}</output>

        <label id="editor-label">Rich-text notes</label>
        <div
          className="ProseMirror editor"
          contentEditable
          role="textbox"
          aria-labelledby="editor-label"
          suppressContentEditableWarning
          onInput={(event) => setEditorValue(event.currentTarget.textContent ?? '')}
        />
        <output data-testid="editor-state">{editorValue}</output>

        <section id="shadow-host" aria-label="Shadow DOM fields" />
      </form>

      <iframe title="Cross-frame form" src="/frame.html" />
    </main>
  )
}

createRoot(document.querySelector('#root')!).render(<App />)
