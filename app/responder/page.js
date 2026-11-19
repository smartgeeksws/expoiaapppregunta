'use client';

import { useState } from 'react';
import { question } from '../question';

export default function Answer() {
  const [answer, setAnswer] = useState('');
  const [state, setState] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (state === 'sending' || !answer.trim()) return;
    setState('sending');
    setMessage('');
    try {
      const response = await fetch('/api/palabras', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error);
        setState('error');
        return;
      }
      setState('sent');
    } catch {
      setMessage('No pudimos confirmar el envío. Revisa tu conexión e inténtalo de nuevo.');
      setState('error');
    }
  }

  return <main className="mobile"><section>
    <h1>{question}</h1>
    {state === 'sent' ? <p className="thanks" role="status">¡Gracias! Tu respuesta ya hace parte de la nube.</p> :
      <form onSubmit={submit}>
        <label htmlFor="answer">Tu respuesta</label>
        <textarea id="answer" rows="4" maxLength="160" required value={answer}
          disabled={state === 'sending'} onChange={(event) => setAnswer(event.target.value)} />
        <p className="hint">Las palabras de tu respuesta se mostrarán en la pantalla.</p>
        {message && <p role="alert">{message}</p>}
        <button disabled={!answer.trim() || state === 'sending'}>{state === 'sending' ? 'Enviando…' : 'Enviar respuesta'}</button>
      </form>}
  </section></main>;
}
