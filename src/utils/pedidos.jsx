export const TEMPO_META_MIN = 25;

export const STATUS_ATIVOS = ["recebido", "em_preparo", "pronto", "saiu_entrega"];

export const ROTULOS_STATUS = {
  recebido: "Recebido",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  saiu_entrega: "Saiu para entrega",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export function milis(timestamp) {
  return timestamp && typeof timestamp.toMillis === "function"
    ? timestamp.toMillis()
    : Date.now();
}

export function minutosDecorridos(pedido, agora) {
  return Math.max(0, Math.floor((agora - milis(pedido.criadoEm)) / 60000));
}

export function precoEfetivo(item) {
  return item.oferta === "promocao" && item.precoPromocional != null
    ? item.precoPromocional
    : item.preco;
}

export function tituloPedido(pedido) {
  if (pedido.tipo === "mesa") return `Mesa ${pedido.mesaNumero}`;
  if (pedido.tipo === "entrega") return `Entrega · ${pedido.clienteNome}`;
  return `Retirada · ${pedido.clienteNome}`;
}

export function proximoStatus(pedido) {
  switch (pedido.status) {
    case "recebido":
      return "em_preparo";
    case "em_preparo":
      return "pronto";
    case "pronto":
      return pedido.tipo === "entrega" ? "saiu_entrega" : "finalizado";
    case "saiu_entrega":
      return "finalizado";
    default:
      return null;
  }
}

export function rotuloAcao(pedido) {
  switch (pedido.status) {
    case "recebido":
      return "Iniciar preparo";
    case "em_preparo":
      return "Marcar como pronto";
    case "pronto":
      if (pedido.tipo === "entrega") return "Saiu para entrega";
      return pedido.tipo === "mesa" ? "Servido na mesa" : "Retirado pelo cliente";
    case "saiu_entrega":
      return "Entregue";
    default:
      return "";
  }
}

export function podeAvancar(perfil, pedido) {
  if (!proximoStatus(pedido)) return false;
  if (perfil === "dono") return true;
  if (perfil === "cozinha") {
    return pedido.status === "recebido" || pedido.status === "em_preparo";
  }
  if (perfil === "funcionario") {
    return pedido.status === "pronto" || pedido.status === "saiu_entrega";
  }
  return false;
}

export function podeGerenciar(perfil) {
  return perfil === "dono" || perfil === "funcionario";
}