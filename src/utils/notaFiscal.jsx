import { formatarCnpj } from "./cnpj";

export function formatarDataHoraFiscal(valor) {
  let data;
  if (!valor) {
    data = new Date();
  } else if (typeof valor?.toDate === "function") {
    data = valor.toDate();
  } else {
    data = new Date(valor);
  }

  if (Number.isNaN(data.getTime())) {
    data = new Date();
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function gerarNumeroNota(pedidoId = "") {
  const limpo = String(pedidoId).replace(/\W/g, "").toUpperCase();
  const base = limpo.slice(-6).padStart(6, "0");
  return `000.${base.slice(0, 3)}.${base.slice(3, 6)}`;
}

export function gerarChaveAcessoSimulada(pedidoId = "", cnpj = "00000000000191") {
  const cnpjDigitos = String(cnpj).replace(/\D/g, "").padEnd(14, "0").slice(0, 14);
  const idDigitos = Array.from(String(pedidoId))
    .map((ch) => String(ch.charCodeAt(0) % 10))
    .join("")
    .padEnd(20, "0")
    .slice(0, 20);
  const sufixo = "65001000011234567890".slice(0, 10);
  const chave44 = `${cnpjDigitos}${idDigitos}${sufixo}`;
  return chave44.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function obterDadosEmitente(pedido = {}) {
  const nomeFantasia =
    pedido.restauranteNome || pedido.nomeRestaurante || "Conecta Sabor Restaurante";
  const cnpjRaw = pedido.restauranteCnpj || pedido.cnpj || "42.358.190/0001-54";
  const endereco =
    pedido.restauranteEndereco || "Av. Washington Soares, 1321 - Fortaleza/CE";

  return {
    nomeFantasia,
    cnpjFormatado: formatarCnpj(cnpjRaw),
    endereco,
  };
}