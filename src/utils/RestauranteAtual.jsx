const CHAVE = "cs_restaurante_atual";

export function salvarRestauranteAtual(id) {
  try {
    localStorage.setItem(CHAVE, id);
  } catch {
    // navegador sem armazenamento: simplesmente não lembra
  }
}

export function lerRestauranteAtual() {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}