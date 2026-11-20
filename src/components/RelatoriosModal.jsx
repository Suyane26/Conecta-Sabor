import { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Row,
  Col,
  Card,
  Spinner,
  Tabs,
  Tab,
  Badge,
  Form,
  Table,
} from "react-bootstrap";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { formatarPreco } from "../utils/formatar";
import { ROTULOS_STATUS, milis } from "../utils/pedidos";
import { calcularRelatorioPedidos, calcularTotalPedido } from "../utils/relatorios";
import { formatarDataHoraFiscal } from "../utils/notaFiscal";
import NotaFiscalModal from "./NotaFiscalModal";

const COR_STATUS = {
  recebido: "secondary",
  em_preparo: "warning",
  pronto: "info",
  saiu_entrega: "primary",
  finalizado: "success",
  cancelado: "danger",
};

const ROTULO_TIPO = {
  entrega: "Entrega",
  retirada: "Retirada",
  mesa: "Mesa",
};

export default function RelatoriosModal({ show, onHide, restauranteId, nomeRestaurante }) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("resumo");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busca, setBusca] = useState("");
  const [pedidoNota, setPedidoNota] = useState(null);

  useEffect(() => {
    if (!show || !restauranteId) return;
    setCarregando(true);

    const consulta = query(
      collection(db, "pedidos"),
      where("restauranteId", "==", restauranteId)
    );

    const cancelar = onSnapshot(
      consulta,
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        lista.sort((a, b) => milis(b.criadoEm) - milis(a.criadoEm));
        setPedidos(lista);
        setCarregando(false);
      },
      (err) => {
        console.error("Erro ao carregar relatórios e histórico:", err);
        setCarregando(false);
      }
    );

    return cancelar;
  }, [show, restauranteId]);

  const resumo = calcularRelatorioPedidos(pedidos);

  const historicoFiltrado = pedidos.filter((p) => {
    if (filtroTipo !== "todos" && p.tipo !== filtroTipo) return false;
    if (!busca.trim()) return true;

    const termo = busca.toLowerCase();
    const itensTexto = (p.itens || []).map((i) => i.nome).join(" ").toLowerCase();
    const cliente = String(p.clienteNome || `Mesa ${p.mesaNumero || ""}`).toLowerCase();
    const entregador = String(p.entregadorNome || "").toLowerCase();
    const endereco = String(p.endereco || "").toLowerCase();

    return (
      itensTexto.includes(termo) ||
      cliente.includes(termo) ||
      entregador.includes(termo) ||
      endereco.includes(termo) ||
      p.id.toLowerCase().includes(termo)
    );
  });

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            Relatórios e Histórico Geral — {nomeRestaurante || "Restaurante"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {carregando ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" />
              Carregando relatórios e histórico...
            </div>
          ) : (
            <Tabs
              activeKey={abaAtiva}
              onSelect={(k) => setAbaAtiva(k || "resumo")}
              className="mb-3"
            >
              <Tab eventKey="resumo" title="Resumo & Indicadores">
                <Row className="g-3 mb-3">
                  <Col xs={12} md={4}>
                    <Card className="h-100 border">
                      <Card.Body>
                        <div className="text-muted small">Vendas (não cancelados)</div>
                        <div className="fs-5 fw-bold text-success mt-1">
                          {formatarPreco(resumo.faturamentoTotal)}
                        </div>
                        <div className="small text-muted mt-1">
                          {resumo.pedidosValidosVenda} pedido(s) válido(s)
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col xs={12} md={4}>
                    <Card className="h-100 border">
                      <Card.Body>
                        <div className="text-muted small">Ticket Médio</div>
                        <div className="fs-5 fw-bold mt-1">
                          {formatarPreco(resumo.ticketMedio)}
                        </div>
                        <div className="small text-muted mt-1">
                          {resumo.pedidosFinalizados} finalizado(s) · {resumo.pedidosCancelados} cancelado(s)
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col xs={12} md={4}>
                    <Card className="h-100 border">
                      <Card.Body>
                        <div className="text-muted small">Tempo Médio de Entrega</div>
                        <div className="fs-5 fw-bold mt-1">
                          {resumo.tempoMedioEntregaMin !== null
                            ? `${resumo.tempoMedioEntregaMin} min`
                            : "Sem dados"}
                        </div>
                        <div className="small text-muted mt-1">
                          Base: {resumo.amostraEntregas} entrega(s) com registro
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Card className="border">
                  <Card.Header className="fw-semibold small">
                    Distribuição por modalidade (pedidos válidos)
                  </Card.Header>
                  <Card.Body className="d-flex flex-wrap justify-content-between gap-2 small">
                    <div>
                      <strong>Entrega:</strong> {resumo.porTipo.entrega}
                    </div>
                    <div>
                      <strong>Retirada:</strong> {resumo.porTipo.retirada}
                    </div>
                    <div>
                      <strong>Mesa:</strong> {resumo.porTipo.mesa}
                    </div>
                    <div>
                      <strong>Total geral:</strong> {resumo.totalPedidos}
                    </div>
                  </Card.Body>
                </Card>
              </Tab>

              <Tab
                eventKey="historico"
                title={`Histórico Geral (${pedidos.length})`}
              >
                <Row className="g-2 mb-3">
                  <Col xs={12} md={8}>
                    <Form.Control
                      size="sm"
                      type="search"
                      placeholder="Buscar por comida, cliente, entregador ou endereço..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Select
                      size="sm"
                      value={filtroTipo}
                      onChange={(e) => setFiltroTipo(e.target.value)}
                    >
                      <option value="todos">Todas as modalidades</option>
                      <option value="entrega">Somente Entregas</option>
                      <option value="retirada">Somente Retiradas</option>
                      <option value="mesa">Somente Mesas</option>
                    </Form.Select>
                  </Col>
                </Row>

                {historicoFiltrado.length === 0 ? (
                  <p className="text-center text-muted py-4 mb-0">
                    Nenhum registro encontrado no histórico.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <Table hover size="sm" className="align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>Pedido / Data</th>
                          <th>Cliente / Modalidade</th>
                          <th>Comidas / Itens</th>
                          <th>Entrega & Entregador</th>
                          <th>Status</th>
                          <th className="text-end">Total</th>
                          <th className="text-end">Nota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicoFiltrado.map((p) => {
                          const st = String(p.status || "").toLowerCase();
                          const totalPedido = calcularTotalPedido(p);
                          return (
                            <tr key={p.id}>
                              <td>
                                <div className="fw-bold">
                                  #{p.id.slice(-5).toUpperCase()}
                                </div>
                                <div className="text-muted">
                                  {formatarDataHoraFiscal(p.criadoEm)}
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold">
                                  {p.tipo === "mesa"
                                    ? `Mesa ${p.mesaNumero || "-"}`
                                    : p.clienteNome || "Cliente"}
                                </div>
                                <Badge bg="light" text="dark" className="border">
                                  {ROTULO_TIPO[p.tipo] || p.tipo}
                                </Badge>
                              </td>
                              <td>
                                {(p.itens || []).map((item, idx) => (
                                  <div key={idx}>
                                    <strong>{item.quantidade}x</strong> {item.nome}
                                  </div>
                                ))}
                              </td>
                              <td>
                                {p.tipo === "entrega" ? (
                                  <>
                                    <div>
                                      <strong>Entregador:</strong>{" "}
                                      {p.entregadorNome || (
                                        <span className="text-muted">Não atribuído</span>
                                      )}
                                    </div>
                                    <div className="text-muted">
                                      {p.endereco || "Endereço não informado"}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td>
                                <Badge bg={COR_STATUS[st] || "secondary"}>
                                  {ROTULOS_STATUS[st] || p.status}
                                </Badge>
                              </td>
                              <td className="text-end fw-bold">
                                {formatarPreco(totalPedido)}
                              </td>
                              <td className="text-end">
                                {st !== "cancelado" && (
                                  <Button
                                    size="sm"
                                    variant="outline-success"
                                    onClick={() => setPedidoNota(p)}
                                  >
                                    NFC-e
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab>
            </Tabs>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" size="sm" onClick={onHide}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      <NotaFiscalModal
        show={Boolean(pedidoNota)}
        onHide={() => setPedidoNota(null)}
        pedido={pedidoNota}
      />
    </>
  );
}