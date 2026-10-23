import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import SolicitacoesPendentes from "../components/SolicitacoesPendentes";

const FUNCIONALIDADES = {
  dono: [
    "Gestão de cardápio",
    "Painel de pedidos",
    "Cadastro de entregadores",
    "Mesas e cozinha",
    "Relatórios",
  ],
  funcionario: ["Painel de pedidos", "Mesas", "Cozinha"],
};

const ROTULOS = { dono: "Dono(a)", funcionario: "Funcionário(a)" };

export default function Dashboard() {
  const { usuario, dados, sair } = useAuth();
  const [restaurante, setRestaurante] = useState(null);

  useEffect(() => {
    async function carregar() {
      if (!dados.restauranteId) return;
      const snap = await getDoc(doc(db, "restaurantes", dados.restauranteId));
      if (snap.exists()) setRestaurante(snap.data());
    }
    carregar();
  }, [dados.restauranteId]);

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="mb-1">
            {restaurante ? restaurante.nome : "Painel do restaurante"}
          </h2>
          <p className="mb-0">
            {dados.nome} <Badge bg="secondary">{ROTULOS[dados.perfil]}</Badge>
          </p>
          <small className="text-muted">{usuario.email}</small>
        </div>
        <Button variant="outline-danger" onClick={sair}>
          Sair
        </Button>
      </div>

      {dados.perfil === "dono" && restaurante && (
        <Card className="mb-4">
          <Card.Body>
            Código do restaurante: <strong>{restaurante.codigoConvite}</strong>
            <div className="small text-muted">
              Compartilhe com funcionários e entregadores para que peçam acesso.
            </div>
          </Card.Body>
        </Card>
      )}

      <h5 className="mb-3">Funcionalidades</h5>
      <Row className="g-3 mb-4">
        {FUNCIONALIDADES[dados.perfil].map((nome) => (
          <Col xs={12} md={4} key={nome}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title className="fs-6">{nome}</Card.Title>
                <Badge bg="light" text="dark">
                  Em breve
                </Badge>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {dados.perfil === "dono" && (
        <SolicitacoesPendentes restauranteId={dados.restauranteId} />
      )}
    </Container>
  );
}