import { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { formatarPreco } from "../utils/formatar";
import { ROTULOS_STATUS } from "../utils/pedidos";

export default function StatusPedido({ show, onHide, pedidoId, onLimpar }) {
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    if (!pedidoId || !show) return;
    const cancelar = onSnapshot(doc(db, "pedidos", pedidoId), (snap) => {
      if (snap.exists()) setPedido({ id: snap.id, ...snap.data() });
    });
    return cancelar;
  }, [pedidoId, show]);

  if (!pedido) return null;

  const passos = ["recebido", "em_preparo", "pronto"];
  if (pedido.tipo === "entrega") passos.push("saiu_entrega");
  passos.push("finalizado");

  const indiceAtual = passos.indexOf(pedido.status);
  const cancelado = pedido.status === "cancelado";

  return (
    <Modal show={show} onHide={onHide} fullscreen className="cs-modal-app">
      <div className="cs-tela-app">
        <div className="cs-header-app">
          <Button variant="link" className="p-0 text-dark fs-4 text-decoration-none" onClick={onHide}>
            &lsaquo; Voltar
          </Button>
          <span className="h6 mb-0">Status do Pedido</span>
          <span style={{ width: "60px" }}></span>
        </div>

        <div className="cs-body-app pb-footer">
          <div className="cs-box text-center mb-4">
            <p className="text-muted small mb-3">
              {pedido.tipo === "entrega" ? "Entrega em domicílio" : "Retirada no balcão"}
            </p>

            {cancelado ? (
              <div className="text-danger fw-bold fs-5 py-3 border rounded" style={{ backgroundColor: "#fee2e2" }}>
                Pedido Cancelado
              </div>
            ) : (
              <div className="text-start mt-4">
                {passos.map((passo, i) => {
                  const concluido = i <= indiceAtual;
                  const ativo = i === indiceAtual;
                  return (
                    <div key={passo} className="d-flex align-items-center mb-3">
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: concluido ? "var(--cs-laranja)" : "#e9ecef",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: concluido ? "#fff" : "#6c757d",
                          fontWeight: "bold",
                          fontSize: "12px",
                          flexShrink: 0
                        }}
                      >
                        {concluido ? "✓" : i + 1}
                      </div>
                      <div className={`ms-3 ${ativo ? "fw-bold text-dark fs-6" : concluido ? "text-dark" : "text-muted"}`}>
                        {ROTULOS_STATUS[passo]}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="cs-box">
            <h6 className="mb-3">Resumo da Compra</h6>
            {pedido.itens.map((item, i) => (
              <div key={i} className="d-flex justify-content-between small mb-2 text-muted">
                <span>{item.quantidade}x {item.nome}</span>
                <span>{formatarPreco(item.preco * item.quantidade)}</span>
              </div>
            ))}
            <hr />
            <div className="d-flex justify-content-between fw-bold">
              <span>Total Pago</span>
              <span>{formatarPreco(pedido.total)}</span>
            </div>
          </div>
        </div>

        {(pedido.status === "finalizado" || cancelado) && (
          <div className="cs-footer-app shadow-lg">
            <Button variant="outline-primary" className="w-100 fw-bold py-2" onClick={onLimpar}>
              Fechar e fazer novo pedido
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}