import { Navigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

export default function RotaProtegida({ children, perfis, semPerfil = false }) {
  const { usuario, dados, carregandoDados } = useAuth();

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

  if (semPerfil) {
    return children;
  }

  if (!dados) {
    return <Navigate to="/escolher-perfil" replace />;
  }

  if (dados.status === "pendente") {
    return <Navigate to="/aguardando" replace />;
  }

  if (perfis && !perfis.includes(dados.perfil)) {
    return <Navigate to="/" replace />;
  }

  return children;
}