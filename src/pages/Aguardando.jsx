import { Navigate } from "react-router-dom";
import { Container, Card, Button } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

export default function Aguardando() {
  const { dados, recarregar, sair } = useAuth();

  if (!dados || dados.status !== "pendente") {
    return <Navigate to="/" replace />;
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Card style={{ width: "100%", maxWidth: "460px" }} className="shadow-sm">
        <Card.Body className="p-4 text-center">
          <h4 className="mb-3">Aguardando aprovação</h4>
          <p className="text-muted">
            Seu pedido de acesso foi enviado. Assim que o dono do restaurante
            aprovar, você poderá entrar no sistema.
          </p>
          <div className="d-grid gap-2">
            <Button onClick={recarregar}>Verificar novamente</Button>
            <Button variant="outline-secondary" onClick={sair}>
              Sair
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}