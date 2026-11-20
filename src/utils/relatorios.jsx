import { milis, precoEfetivo } from "./pedidos";

export function calcularTotalPedido(pedido = {}) {
  if (pedido.total !== undefined && pedido.total !== null && !Number.isNaN(Number(pedido.total))) {
    return Number(pedido.total);
  }
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  return itens.reduce(
    (acc, item) => acc + Number(precoEfetivo(item) || 0) * Number(item.quantidade || 1),
    0
  );
}

export function obterTimestampConclusaoMs(pedido = {}) {
  const candidato =
    pedido.entregueEm ||
    pedido.finalizadoEm ||
    pedido.concluidoEm ||
    pedido.atualizadoEm ||
    pedido.criadoEm;

  if (!candidato) return null;
  if (typeof candidato?.toMillis === "function") return candidato.toMillis();
  const parsed = new Date(candidato).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function calcularRelatorioPedidos(pedidos = []) {
  const lista = Array.isArray(pedidos) ? pedidos : [];

  const pedidosValidosVenda = lista.filter(
    (p) => String(p.status || "").toLowerCase() !== "cancelado"
  );

  const faturamentoTotal = pedidosValidosVenda.reduce(
    (acc, p) => acc + calcularTotalPedido(p),
    0
  );

  const totalPedidos = lista.length;
  const pedidosFinalizados = lista.filter(
    (p) => String(p.status || "").toLowerCase() === "finalizado"
  ).length;
  const pedidosCancelados = lista.filter(
    (p) => String(p.status || "").toLowerCase() === "cancelado"
  ).length;

  const ticketMedio =
    pedidosValidosVenda.length > 0
      ? faturamentoTotal / pedidosValidosVenda.length
      : 0;

  const porTipo = {
    entrega: 0,
    mesa: 0,
    retirada: 0,
  };

  for (const p of pedidosValidosVenda) {
    if (p.tipo === "entrega") porTipo.entrega += 1;
    else if (p.tipo === "mesa") porTipo.mesa += 1;
    else porTipo.retirada += 1;
  }

  // Tempo médio de entrega (em minutos) para pedidos de entrega com timestamps válidos
  const temposEntregaMin = lista
    .filter((p) => {
      const st = String(p.status || "").toLowerCase();
      return p.tipo === "entrega" && (st === "finalizado" || st === "saiu_entrega");
    })
    .map((p) => {
      const inicioMs = p.criadoEm ? milis(p.criadoEm) : null;
      const fimMs = obterTimestampConclusaoMs(p);
      if (!inicioMs || !fimMs || fimMs <= inicioMs) return null;
      const diffMin = (fimMs - inicioMs) / 60000;
      return diffMin > 0 && diffMin <= 240 ? diffMin : null;
    })
    .filter((v) => v !== null);

  const tempoMedioEntregaMin =
    temposEntregaMin.length > 0
      ? Math.round(
          temposEntregaMin.reduce((acc, m) => acc + m, 0) / temposEntregaMin.length
        )
      : null;

  return {
    faturamentoTotal,
    totalPedidos,
    pedidosValidosVenda: pedidosValidosVenda.length,
    pedidosFinalizados,
    pedidosCancelados,
    ticketMedio,
    porTipo,
    tempoMedioEntregaMin,
    amostraEntregas: temposEntregaMin.length,
  };
}