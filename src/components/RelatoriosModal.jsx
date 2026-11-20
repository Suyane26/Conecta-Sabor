import { useEffect, useState } from "react";
import { Modal, Button, Row, Col, Card, Spinner } from "react-bootstrap";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { formatarPreco } from "../utils/formatar";
import { calcularRelatorioPedidos } from "../utils/relatorios";

export default function RelatoriosModal({ show, onHide, restauranteId, nomeRestaurante }) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);

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
        setPedidos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCarregando(false);
      },
      (err) => {
        console.error("Erro ao carregar relatórios:", err);
        setCarregando(false);
      }
    );

    return cancelar;
  }, [show, restauranteId]);

  const resumo = calcularRelatorioPedidos(pedidos);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold">
          Relatórios — {nomeRestaurante || "Restaurante"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {carregando ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" />
            Carregando indicadores...
          </div>
        ) : (
          <>
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
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" size="sm" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}