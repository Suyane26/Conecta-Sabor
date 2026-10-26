import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner } from "react-bootstrap";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import NovoPedido from "../components/NovoPedido";
import { formatarPreco } from "../utils/formatar";
import { ROTULOS_STATUS, STATUS_ATIVOS } from "../utils/pedidos";

export default function Mesas() {
  const { dados } = useAuth();
  const restauranteId = dados.restauranteId;
  const ehDono = dados.perfil === "dono";

  const [mesas, setMesas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [mostrarAdicionar, setMostrarAdicionar] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [salvando, setSalvando] = useState(false);

  const [mesaAbertaId, setMesaAbertaId] = useState(null);
  const [mesaPedidoId, setMesaPedidoId] = useState(null);

  useEffect(() => {
    const consultaMesas = query(
      collection(db, "mesas"),
      where("restauranteId", "==", restauranteId)
    );
    const cancelarMesas = onSnapshot(
      consultaMesas,
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        lista.sort((a, b) => a.numero - b.numero);
        setMesas(lista);
        setCarregando(false);
      },
      (e) => {
        console.error("Erro ao carregar as mesas:", e);
        setCarregando(false);
      }
    );

    const consultaPedidos = query(
      collection(db, "pedidos"),
      where("restauranteId", "==", restauranteId),
      where("contaAberta", "==", true)
    );
    const cancelarPedidos = onSnapshot(
      consultaPedidos,
      (snap) => setPedidos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.error("Erro ao carregar os pedidos das mesas:", e)
    );

    return () => {
      cancelarMesas();
      cancelarPedidos();
    };
  }, [restauranteId]);

  function pedidosDaMesa(mesaId) {
    return pedidos.filter((p) => p.mesaId === mesaId);
  }

  function contaDaMesa(mesaId) {
    return pedidosDaMesa(mesaId)
      .filter((p) => p.status !== "cancelado")
      .reduce((soma, p) => soma + p.total, 0);
  }

  async function adicionarMesas(e) {
    e.preventDefault();
    setErro("");

    const qtd = Math.floor(Number(quantidade));
    if (!(qtd >= 1 && qtd <= 50)) {
      return setErro("Informe de 1 a 50 mesas.");
    }

    setSalvando(true);
    try {
      const maior = mesas.reduce((m, x) => Math.max(m, x.numero), 0);
      const lote = writeBatch(db);
      for (let i = 1; i <= qtd; i++) {
        lote.set(doc(collection(db, "mesas")), {
          restauranteId,
          numero: maior + i,
          status: "livre",
          criadoEm: serverTimestamp(),
        });
      }
      await lote.commit();
      setMostrarAdicionar(false);
      setQuantidade(1);
    } catch (err) {
      console.error(err);
      setErro("Não foi possível adicionar as mesas.");
    } finally {
      setSalvando(false);
    }
  }

  async function fecharConta(mesa) {
    const daMesa = pedidosDaMesa(mesa.id);
    const emAndamento = daMesa.some((p) => STATUS_ATIVOS.includes(p.status));
    const pergunta = emAndamento
      ? "Ainda há pedidos em andamento nesta mesa. Fechar a conta mesmo assim?"
      : `Fechar a conta da Mesa ${mesa.numero}?`;
    if (!window.confirm(pergunta)) return;

    setErro("");
    try {
      const lote = writeBatch(db);
      daMesa.forEach((p) => lote.update(doc(db, "pedidos", p.id), { contaAberta: false }));
      lote.update(doc(db, "mesas", mesa.id), { status: "livre" });
      await lote.commit();
      setMesaAbertaId(null);
    } catch (err) {
      console.error(err);
      setErro("Não foi possível fechar a conta.");
    }
  }

  async function excluirMesa(mesa) {
    if (!window.confirm(`Excluir a Mesa ${mesa.numero}?`)) return;
    setErro("");
    try {
      await deleteDoc(doc(db, "mesas", mesa.id));
      setMesaAbertaId(null);
    } catch (err) {
      console.error(err);
      setErro("Não foi possível excluir a mesa.");
    }
  }

  const mesaSelecionada = mesas.find((m) => m.id === mesaAbertaId) || null;
  const mesaParaPedido = mesas.find((m) => m.id === mesaPedidoId) || null;
  const pedidosSelecionada = mesaSelecionada ? pedidosDaMesa(mesaSelecionada.id) : [];

  return (
    <Container className="py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <Link to="/painel" className="small">
            &larr; Voltar ao painel
          </Link>
          <h2 className="mb-0">Mesas</h2>
        </div>
        <Button onClick={() => setMostrarAdicionar(true)}>Adicionar mesas</Button>
      </div>

      {erro && (
        <Alert variant="danger" dismissible onClose={() => setErro("")}>
          {erro}
        </Alert>
      )}

      {carregando ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : mesas.length === 0 ? (
        <p className="text-muted text-center py-5">
          Nenhuma mesa cadastrada. Clique em Adicionar mesas para começar.
        </p>
      ) : (
        <Row xs={2} sm={3} md={4} lg={6} className="g-3">
          {mesas.map((mesa) => {
            const ocupada = mesa.status === "ocupada";
            return (
              <Col key={mesa.id}>
                <Card
                  role="button"
                  className={`cs-mesa ${ocupada ? "ocupada" : "livre"}`}
                  onClick={() => setMesaAbertaId(mesa.id)}
                >
                  <Card.Body className="text-center py-3">
                    <div className="h5 mb-1">Mesa {mesa.numero}</div>
                    <span className={`cs-selo ${ocupada ? "" : "cs-selo-livre"}`}>
                      {ocupada ? "Ocupada" : "Livre"}
                    </span>
                    {ocupada && (
                      <div className="small text-muted mt-1">
                        {formatarPreco(contaDaMesa(mesa.id))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal show={mostrarAdicionar} onHide={() => setMostrarAdicionar(false)} centered>
        <Form onSubmit={adicionarMesas}>
          <Modal.Header closeButton>
            <Modal.Title className="h5">Adicionar mesas</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group controlId="quantidade">
              <Form.Label>Quantas mesas?</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="50"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                required
              />
              <Form.Text>
                As mesas são numeradas em sequência, a partir da última existente.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setMostrarAdicionar(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Adicionando..." : "Adicionar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={Boolean(mesaSelecionada)} onHide={() => setMesaAbertaId(null)} centered>
        {mesaSelecionada && (
          <>
            <Modal.Header closeButton>
              <Modal.Title className="h5">Mesa {mesaSelecionada.numero}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {pedidosSelecionada.length === 0 ? (
                <p className="text-muted mb-0">Nenhum pedido nesta mesa ainda.</p>
              ) : (
                <>
                  {pedidosSelecionada.map((p) => (
                    <div key={p.id} className="cs-pedido">
                      <div className="mb-2">
                        <span className={`cs-status cs-status-${p.status}`}>
                          {ROTULOS_STATUS[p.status]}
                        </span>
                      </div>
                      <ul className="list-unstyled mb-1">
                        {p.itens.map((item, i) => (
                          <li key={i} className="mb-1">
                            <span className="fw-semibold">{item.quantidade}x</span>{" "}
                            {item.nome}
                            {item.observacao && (
                              <div className="cs-obs">{item.observacao}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                      {p.observacoes && (
                        <div className="cs-obs">Obs. do pedido: {p.observacoes}</div>
                      )}
                    </div>
                  ))}

                  <div className="d-flex justify-content-between fw-semibold border-top pt-2">
                    <span>Total da conta</span>
                    <span>{formatarPreco(contaDaMesa(mesaSelecionada.id))}</span>
                  </div>
                </>
              )}
            </Modal.Body>

            <Modal.Footer className="justify-content-between">
              <div>
                {ehDono && mesaSelecionada.status === "livre" && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => excluirMesa(mesaSelecionada)}
                  >
                    Excluir mesa
                  </Button>
                )}
              </div>
              <div className="d-flex gap-2">
                {mesaSelecionada.status === "ocupada" && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => fecharConta(mesaSelecionada)}
                  >
                    Fechar conta
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setMesaPedidoId(mesaSelecionada.id);
                    setMesaAbertaId(null);
                  }}
                >
                  Novo pedido
                </Button>
              </div>
            </Modal.Footer>
          </>
        )}
      </Modal>

      <NovoPedido
        show={Boolean(mesaParaPedido)}
        onHide={() => setMesaPedidoId(null)}
        restauranteId={restauranteId}
        mesaFixa={mesaParaPedido}
        onCriado={() => setMesaAbertaId(mesaPedidoId)}
      />
    </Container>
  );
}