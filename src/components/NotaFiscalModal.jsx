import { Modal, Button, Table } from "react-bootstrap";
import { formatarPreco } from "../utils/formatar";
import {
  formatarDataHoraFiscal,
  gerarChaveAcessoSimulada,
  gerarNumeroNota,
  obterDadosEmitente,
} from "../utils/notaFiscal";

export default function NotaFiscalModal({ show, onHide, pedido }) {
  if (!pedido) return null;

  const emitente = obterDadosEmitente(pedido);
  const numeroNota = gerarNumeroNota(pedido.id);
  const dataEmissao = formatarDataHoraFiscal(
    pedido.atualizadoEm || pedido.criadoEm || new Date()
  );
  const chaveAcesso = gerarChaveAcessoSimulada(pedido.id, emitente.cnpjFormatado);
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];

  const subtotal = itens.reduce(
    (acc, item) => acc + Number(item.preco || 0) * Number(item.quantidade || 1),
    0
  );
  const totalExibido =
    pedido.total !== undefined && pedido.total !== null
      ? Number(pedido.total)
      : subtotal;
  const taxaEntrega = Math.max(0, totalExibido - subtotal);

  function handleBaixarTxt() {
    const linhas = [
      "========================================",
      "         CONECTA SABOR - NFC-e SIMULADA",
      "   DOCUMENTO AUXILIAR DA NOTA FISCAL",
      "========================================",
      `Emitente: ${emitente.nomeFantasia}`,
      `CNPJ: ${emitente.cnpjFormatado}`,
      `Endereco: ${emitente.endereco}`,
      `NFC-e N: ${numeroNota}  Serie: 001`,
      `Emissao: ${dataEmissao}`,
      `Pedido: #${String(pedido.id).slice(0, 8).toUpperCase()}`,
      `Modalidade: ${pedido.tipo === "entrega" ? "Entrega" : "Retirada no balcao"}`,
      "----------------------------------------",
      "ITENS:",
      ...itens.map((item, idx) => {
        const qtd = Number(item.quantidade || 1);
        const unit = Number(item.preco || 0);
        return `${String(idx + 1).padStart(2, "0")} ${item.nome} | ${qtd}x ${formatarPreco(unit)} = ${formatarPreco(qtd * unit)}`;
      }),
      "----------------------------------------",
      `Subtotal: ${formatarPreco(subtotal)}`,
      ...(taxaEntrega > 0 ? [`Taxa entrega: ${formatarPreco(taxaEntrega)}`] : []),
      `TOTAL PAGO: ${formatarPreco(totalExibido)}`,
      `Pagamento: ${pedido.formaPagamento || "Pagamento simulado no app"}`,
      "----------------------------------------",
      "CHAVE DE ACESSO (SIMULACAO ACADEMICA):",
      chaveAcesso,
      "========================================",
    ];

    const blob = new Blob([linhas.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NFCe-${numeroNota.replace(/\./g, "")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal show={show} onHide={onHide} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold">
          Nota Fiscal Eletrónica Simulada (NFC-e)
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
        <div className="text-center border-bottom pb-2 mb-3">
          <div className="fw-bold text-uppercase">{emitente.nomeFantasia}</div>
          <div className="small text-muted">CNPJ: {emitente.cnpjFormatado}</div>
          <div className="small text-muted">{emitente.endereco}</div>
          <div className="badge bg-warning text-dark mt-2">
            AMBIENTE DE SIMULAÇÃO ACADÉMICA
          </div>
        </div>

        <div className="d-flex justify-content-between small mb-1">
          <span>
            <strong>NFC-e nº:</strong> {numeroNota}
          </span>
          <span>
            <strong>Série:</strong> 001
          </span>
        </div>
        <div className="small mb-1">
          <strong>Emissão:</strong> {dataEmissao}
        </div>
        <div className="small mb-1">
          <strong>Pedido:</strong> #{String(pedido.id).slice(0, 8).toUpperCase()}
        </div>
        <div className="small mb-3">
          <strong>Tipo:</strong>{" "}
          {pedido.tipo === "entrega" ? "Entrega em domicílio" : "Retirada no balcão"}
        </div>

        {pedido.tipo === "entrega" && pedido.endereco && (
          <div className="small bg-light p-2 rounded border mb-3">
            <strong>Destino:</strong> {pedido.endereco}
            {pedido.clienteTelefone && <div>Tel: {pedido.clienteTelefone}</div>}
          </div>
        )}

        <Table size="sm" borderless className="mb-2">
          <thead>
            <tr className="border-bottom">
              <th>Item</th>
              <th className="text-center">Qtd</th>
              <th className="text-end">Valor</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, i) => {
              const qtd = Number(item.quantidade || 1);
              const totalItem = Number(item.preco || 0) * qtd;
              return (
                <tr key={i}>
                  <td>{item.nome}</td>
                  <td className="text-center">{qtd}x</td>
                  <td className="text-end">{formatarPreco(totalItem)}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>

        <div className="border-top pt-2">
          <div className="d-flex justify-content-between small">
            <span>Subtotal</span>
            <span>{formatarPreco(subtotal)}</span>
          </div>
          {taxaEntrega > 0 && (
            <div className="d-flex justify-content-between small">
              <span>Taxa de entrega</span>
              <span>{formatarPreco(taxaEntrega)}</span>
            </div>
          )}
          <div className="d-flex justify-content-between fw-bold fs-6 mt-1 pt-1 border-top">
            <span>TOTAL</span>
            <span>{formatarPreco(totalExibido)}</span>
          </div>
          <div className="small text-muted mt-1">
            Pagamento: {pedido.formaPagamento || "Confirmado no pedido"}
          </div>
        </div>

        <div className="mt-3 pt-2 border-top text-center">
          <div className="small fw-semibold text-muted mb-1">
            Chave de Acesso (Simulada)
          </div>
          <div className="small text-break bg-light p-2 rounded border">
            {chaveAcesso}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-secondary" size="sm" onClick={handleBaixarTxt}>
          Baixar Cupom (.txt)
        </Button>
        <div className="d-flex gap-2">
          <Button variant="outline-dark" size="sm" onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button variant="primary" size="sm" onClick={onHide}>
            Fechar
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}