import { useEffect, useRef, useState } from "react";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function App() {
  const [mode, setMode] = useState("live");
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Pulsa el círculo para comenzar.");
  const [sessions, setSessions] = useState(() => JSON.parse(localStorage.getItem("voz-clara-sessions") || "[]"));
  const recorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const chunksRef = useRef([]);
  const finalTextRef = useRef("");

  useEffect(() => {
    localStorage.setItem("voz-clara-sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (!isRecording) return undefined;
    const timerId = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timerId);
  }, [isRecording]);

  function updateTranscript(value) {
    setTranscript(value);
  }

  function startRecognition() {
    if (!SpeechRecognition) {
      setStatus("Este navegador no ofrece Web Speech API.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const phrase = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalTextRef.current += `${phrase} `;
        else interim += phrase;
      }
      updateTranscript(`${finalTextRef.current}${interim}`.trim());
    };
    recognition.onerror = (event) => setStatus(`No se pudo reconocer la voz: ${event.error}`);
    recognition.onend = () => {
      if (isRecording) recognition.start();
    };
    recognition.start();
    recognitionRef.current = recognition;
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => stream.getTracks().forEach((track) => track.stop());
      recorder.start();
      recorderRef.current = recorder;
      finalTextRef.current = "";
      setTranscript("");
      setSeconds(0);
      startRecognition();
      setIsRecording(true);
      setStatus("Escuchando... habla con naturalidad.");
    } catch {
      setStatus("No se pudo acceder al micrófono. Revisa los permisos.");
    }
  }

  function stopRecording() {
    setIsRecording(false);
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    recognitionRef.current?.stop();
    setStatus("Grabación terminada. Revisa el texto antes de guardarlo.");
  }

  function reset() {
    if (isRecording) stopRecording();
    finalTextRef.current = "";
    setTranscript("");
    setSeconds(0);
    setStatus("Pulsa el círculo para comenzar.");
  }

  function saveSession() {
    if (!transcript.trim()) return;
    const session = {
      title: `Sesión ${new Date().toLocaleDateString("es-ES")}`,
      duration: formatTime(seconds),
      mode: mode === "live" ? "Web Speech API" : "Gemini por lotes",
      transcript: transcript.trim(),
      createdAt: new Date().toISOString(),
    };
    setSessions((current) => [session, ...current]);
    setStatus("Sesión guardada.");
  }

  function exportSessions() {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "voz-clara-sesiones.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main>
      <header className="topbar">
        <div><p className="eyebrow">Laboratorio de voz</p><h1>Voz Clara</h1></div>
        <div className="signal"><span className={`signal-dot ${isRecording ? "live" : ""}`} />{isRecording ? "Grabando" : "Listo"}</div>
      </header>

      <section className="hero" aria-labelledby="screen-title">
        <h2 id="screen-title">Captura una idea</h2>
        <p className="intro">Graba una nota y revisa su transcripción al instante.</p>
        <div className="mode-row" role="tablist" aria-label="Modo de transcripción">
          <button className={`mode ${mode === "live" ? "active" : ""}`} onClick={() => { setMode("live"); setStatus("Modo en vivo: Web Speech API."); }} role="tab" aria-selected={mode === "live"}><strong>En vivo</strong><span>Web Speech API</span></button>
          <button className={`mode ${mode === "batch" ? "active" : ""}`} onClick={() => { setMode("batch"); setStatus("Modo por lotes: guarda el audio y procésalo con Gemini."); }} role="tab" aria-selected={mode === "batch"}><strong>Por lotes</strong><span>Gemini + audio</span></button>
        </div>
        <div className="record-area">
          <button className={`record-button ${isRecording ? "recording" : ""}`} onClick={isRecording ? stopRecording : startRecording} aria-label={isRecording ? "Detener grabación" : "Iniciar grabación"}>{isRecording ? "■" : "●"}</button>
          <span className="timer">{formatTime(seconds)}</span>
        </div>
        <p className="status" role="status">{status}</p>
        <p className="label">Transcripción</p>
        <div className={`transcript ${transcript ? "" : "empty"}`} aria-live="polite">{transcript || "Tu texto aparecerá aquí mientras hablas."}</div>
        <div className="actions"><button className="secondary" onClick={reset}>Limpiar</button><button className="primary" disabled={!transcript.trim()} onClick={saveSession}>Guardar sesión</button></div>
      </section>

      <section className="history" aria-labelledby="history-title">
        <div className="history-head"><h2 id="history-title">Sesiones recientes</h2><button className="export" onClick={exportSessions}>Exportar</button></div>
        {!sessions.length ? <p className="status">Todavía no hay sesiones guardadas.</p> : sessions.slice(0, 5).map((session, index) => <article className="session" key={`${session.createdAt}-${index}`}><div><strong>{session.title}</strong><small>{session.duration} · {session.mode}</small></div><button className="download" onClick={() => downloadText(session)} aria-label={`Descargar ${session.title}`}>↓</button></article>)}
      </section>

      <nav aria-label="Navegación principal"><div><span><b>●</b>Grabar</span><span><b>⌁</b>Sesiones</span><span><b>⋯</b>Más</span></div></nav>
    </main>
  );
}

function downloadText(session) {
  const blob = new Blob([session.transcript], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${session.title}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default App;
