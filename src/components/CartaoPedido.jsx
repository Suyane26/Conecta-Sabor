import { formatarPreco } from "../utils/formatar";
import { TEMPO_META_MIN, minutosDecorridos, tituloPedido } from "../utils/pedidos";

export default function CartaoPedido({ pedido, agora, mostrarTotal = false, acoes }) {
  const minutos = minutosDecorridos(pedido, agora);
  const naCozinha = pedido.status === "recebido" || pedido.status === "em_preparo";
  const atrasado = naCozinha && minutos >= TEMPO_META_MIN;

  return (
    <div className={`cs-pedido${atrasado ? " cs-pedido-atrasado" : ""}`}>
      <div className="d-flex justify-content-between align-items-start gap-2">
        <strong>{tituloPedido(pedido)}</strong>
        <span className={`small ${atrasado ? "text-danger fw-semibold" : "text-muted"}`}>
          {minutos} min
        </span>
      </div>

      {atrasado && <span className="cs-selo cs-selo-atrasado">Atrasado</span>}

      <ul className="list-unstyled mt-2 mb-2">
        {pedido.itens.map((item, i) => (
          <li key={i} className="mb-1">
            <span className="fw-semibold">{item.quantidade}x</span> {item.nome}
            {item.observacao && <div className="cs-obs">{item.observacao}</div>}
          </li>
        ))}
      </ul>

      {pedido.observacoes && (
        <div className="cs-obs mb-2">Obs. do pedido: {pedido.observacoes}</div>
      )}

      {pedido.tipo === "entrega" && (
        <div className="small text-muted">
          {pedido.endereco}
          {pedido.clienteTelefone && ` · ${pedido.clienteTelefone}`}
        </div>
      )}

      {pedido.entregadorNome && (
        <div className="small">Entregador: {pedido.entregadorNome}</div>
      )}

      {mostrarTotal && (
        <div className="small mt-1">Total: {formatarPreco(pedido.total)}</div>
      )}

      {acoes}
    </div>
  );
}