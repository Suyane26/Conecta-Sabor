import { Container, Button } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

export default function ClienteInicio() {
  const { dados, sair } = useAuth();

  return (
    <Container className="py-5 text-center" style={{ maxWidth: "460px" }}>
      <h4>Olá, {dados.nome}!</h4>
      <p className="text-muted">
        Para fazer um pedido, abra o link ou o QR Code do restaurante onde você
        quer pedir.
      </p>
      <Button variant="outline-danger" onClick={sair}>
        Sair
      </Button>
    </Container>
  );
}