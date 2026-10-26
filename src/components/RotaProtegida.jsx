import { Navigate } from "react-router-dom";
import { Container, Spinner, Button } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

export default function RotaProtegida({ children, perfis }) {
  const { usuario, dados, carregandoDados, sair } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (carregandoDados) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!dados) {
    return (
      <Container className="py-5 text-center" style={{ maxWidth: "460px" }}>
        <h5>Cadastro incompleto</h5>
        <p className="text-muted">
          Não encontramos os dados desta conta. Saia e crie sua conta
          escolhendo o seu tipo de usuário.
        </p>
        <Button onClick={sair}>Sair</Button>
      </Container>
    );
  }

  if (perfis && !perfis.includes(dados.perfil)) {
    return <Navigate to="/" replace />;
  }

  return children;
}