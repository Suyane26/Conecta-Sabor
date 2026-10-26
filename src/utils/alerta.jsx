let contexto = null;

function obterContexto() {
  if (!contexto) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (Audio) contexto = new Audio();
  }
  return contexto;
}

export function prepararAlerta() {
  const ctx = obterContexto();
  if (ctx && ctx.state === "suspended") ctx.resume();
}

export function tocarAlerta() {
  try {
    const ctx = obterContexto();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const oscilador = ctx.createOscillator();
    const ganho = ctx.createGain();
    oscilador.type = "sine";
    oscilador.frequency.value = 880;

    ganho.gain.setValueAtTime(0.0001, ctx.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

    oscilador.connect(ganho);
    ganho.connect(ctx.destination);
    oscilador.start();
    oscilador.stop(ctx.currentTime + 0.65);
  } catch {
    // sem áudio disponível: segue sem som
  }
}