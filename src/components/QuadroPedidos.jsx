import { useEffect, useRef, useState } from "react";
import { Row, Col, Button, Form, Alert, Spinner } from "react-bootstrap";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import CartaoPedido from "./CartaoPedido";
import { useAgora, usePedidosAtivos } from "../hooks/usePedidosAtivos";
import {
  podeAvancar,
  podeGerenciar,
  proximoStatus,
  rotuloAcao,
} from "../utils/pedidos";
import { tocarAlerta } from "../utils/alerta";

const ANTES_DE_SAIR = ["recebido", "em_preparo", "pronto"];

export default function QuadroPedidos({
  restauranteId,
  perfil,
  colunas,
  entregadores = [],
  somAtivo = false,
  mostrarTotal = false,
}) {
  const { pedidos, carregando } = usePedidosAtivos(restauranteId);
  const agora = useAgora();
  const [erro, setErro] = useState("");
  const vistos = useRef(null);

  useEffect(() => {
    if (carregando) return;

    const recebidos = pedidos.filter((p) => p.status === "recebido").map((p) => p.id);

    if (vistos.current === null) {
      vistos.current = new Set(recebidos);
      return;
    }

    const temNovo = recebidos.some((id) => !vistos.current.has(id));
    if (temNovo && somAtivo) tocarAlerta();
    vistos.current = new Set(recebidos);
  }, [pedidos, carregando, somAtivo]);

  async function mudarStatus(pedido, status) {
    setErro("");
    try {
      await updateDoc(doc(db, "pedidos", pedido.id), {
        status,
        statusAtualizadoEm: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      setErro("Não foi possível atualizar o pedido. Tente novamente.");
    }
  }

  function avancar(pedido) {
    const proximo = proximoStatus(pedido);
    if (proximo === "saiu_entrega" && !pedido.entregadorId) {
      setErro("Escolha o entregador antes de enviar o pedido para entrega.");
      return;
    }
    mudarStatus(pedido, proximo);
  }

  function cancelar(pedido) {
    if (!window.confirm("Cancelar este pedido?")) return;
    mudarStatus(pedido, "cancelado");
  }

  async function atribuir(pedido, entregadorId) {
    setErro("");
    const entregador = entregadores.find((e) => e.id === entregadorId);
    try {
      await updateDoc(doc(db, "pedidos", pedido.id), {
        entregadorId: entregador ? entregador.id : null,
        entregadorNome: entregador ? entregador.nome : null,
      });
    } catch (e) {
      console.error(e);
      setErro("Não foi possível definir o entregador.");
    }
  }

  if (carregando) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      {erro && (
        <Alert variant="danger" dismissible onClose={() => setErro("")}>
          {erro}
        </Alert>
      )}

      <Row className="g-3">
        {colunas.map((coluna) => {
          const lista = pedidos.filter((p) => p.status === coluna.status);

          return (
            <Col xs={12} md={12 / colunas.length} key={coluna.status}>
              <div className="cs-coluna h-100">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className={`cs-status cs-status-${coluna.status}`}>
                    {coluna.titulo}
                  </span>
                  <span className="text-muted small">{lista.length}</span>
                </div>

                {lista.length === 0 && (
                  <p className="text-muted small mb-0">Nenhum pedido.</p>
                )}

                {lista.map((pedido) => (
                  <CartaoPedido
                    key={pedido.id}
                    pedido={pedido}
                    agora={agora}
                    mostrarTotal={mostrarTotal}
                    acoes={
                      <div className="d-grid gap-2 mt-2">
                        {pedido.tipo === "entrega" &&
                          podeGerenciar(perfil) &&
                          ANTES_DE_SAIR.includes(pedido.status) && (
                            <Form.Select
                              size="sm"
                              value={pedido.entregadorId || ""}
                              onChange={(e) => atribuir(pedido, e.target.value)}
                            >
                              <option value="">Escolher entregador</option>
                              {entregadores.map((en) => (
                                <option key={en.id} value={en.id}>
                                  {en.nome}
                                </option>
                              ))}
                            </Form.Select>
                          )}

                        {podeAvancar(perfil, pedido) && (
                          <Button size="sm" onClick={() => avancar(pedido)}>
                            {rotuloAcao(pedido)}
                          </Button>
                        )}

                        {podeGerenciar(perfil) &&
                          ANTES_DE_SAIR.includes(pedido.status) && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => cancelar(pedido)}
                            >
                              Cancelar pedido
                            </Button>
                          )}
                      </div>
                    }
                  />
                ))}
              </div>
            </Col>
          );
        })}
      </Row>
    </>
  );
}