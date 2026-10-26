import { Link, useNavigate } from "react-router-dom";
import { Container, Card, Row, Col } from "react-bootstrap";

const OPCOES = [
  {
    valor: "restaurante",
    titulo: "Sou um restaurante",
    texto: "Cadastre seu restaurante e gerencie cardápio, pedidos e equipe.",
  },
  {
    valor: "cliente",
    titulo: "Sou cliente",
    texto: "Peça comida e acompanhe seus pedidos.",
  },
];

export default function Cadastro() {
  const navigate = useNavigate();

  function escolher(valor) {
    navigate(valor === "restaurante" ? "/cadastro/restaurante" : "/cadastro/cliente");
  }

  return (
    <Container className="py-5" style={{ maxWidth: "720px" }}>
      <h3 className="text-center mb-1">Conecta Sabor</h3>
      <p className="text-center text-muted mb-4">Como você quer usar o sistema?</p>

      <Row className="g-3 mb-3">
        {OPCOES.map((o) => (
          <Col xs={12} md={6} key={o.valor}>
            <Card
              className="h-100"
              role="button"
              style={{ cursor: "pointer" }}
              onClick={() => escolher(o.valor)}
            >
              <Card.Body>
                <Card.Title className="fs-6">{o.titulo}</Card.Title>
                <Card.Text className="text-muted small mb-0">{o.texto}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <p className="text-center text-muted small">
        Faz parte da equipe de um restaurante? Peça o link de cadastro ao dono ou
        administrador.
      </p>

      <div className="text-center">
        Já tem conta? <Link to="/login">Entrar</Link>
      </div>
    </Container>
  );
}