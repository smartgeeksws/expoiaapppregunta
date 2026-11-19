'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { question } from './question';

export default function Display() {
  const [qr, setQr] = useState('');
  const [words, setWords] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const url = new URL('/responder', window.location.origin);
    QRCode.toDataURL(url.href, { width: 480, margin: 4 }).then(setQr).catch(() => {});

    let active = true;
    let timer;
    let request;
    async function refresh() {
      request = new AbortController();
      try {
        const response = await fetch('/api/palabras', { cache: 'no-store', signal: request.signal });
        if (!response.ok) throw new Error('No se pudo actualizar la nube');
        const data = await response.json();
        if (active) {
          setWords(data.words);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) timer = setTimeout(refresh, 2000);
      }
    }
    refresh();
    return () => {
      active = false;
      clearTimeout(timer);
      request?.abort();
    };
  }, []);

  const largest = Math.max(2, words[0]?.count ?? 0);
  return <main className="display">
    <section className="prompt">
      <h1>{question}</h1>
      <a className="scan" href="/responder">
        {qr && <img src={qr} width="184" height="184" alt="Código QR para responder" />}
        <span>Escanea para responder</span>
      </a>
    </section>
    <section className="cloud" aria-label="Nube de palabras">
      {words.map(({ word, count }, index) => <span key={word} className="word"
        style={{ '--scale': Math.log(count) / Math.log(largest), '--color': index % 4 }}
        title={`${count} ${count === 1 ? 'respuesta' : 'respuestas'}`}>{word}</span>)}
      {error && <p role="status">La nube no está disponible en este momento.</p>}
      {!error && words.length === 0 && <p>Las respuestas aparecerán aquí</p>}
    </section>
  </main>;
}
