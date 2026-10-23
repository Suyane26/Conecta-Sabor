import { Container, Button } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

export default function EmConstrucao({ titulo }) {
  const { dados, sair } = useAuth();

  return (
    <Container className="py-5">
      <h2>{titulo}</h2>
      <p className="text-muted">
        Olá, {dados.nome}! Esta área faz parte do app mobile e está em
        construção.
      </p>
      <Button variant="outline-danger" onClick={sair}>
        Sair
      </Button>
    </Container>
  );
}