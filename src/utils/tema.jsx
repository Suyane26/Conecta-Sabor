const CHAVE_TEMA = "cs-tema";

export function obterTemaSalvo() {
  try {
    const salvo = window.localStorage.getItem(CHAVE_TEMA);
    return salvo === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function aplicarTema(tema) {
  const valor = tema === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-cs-tema", valor);
  try {
    window.localStorage.setItem(CHAVE_TEMA, valor);
  } catch {
    // Ignora falha de storage em modo restrito
  }
  return valor;
}