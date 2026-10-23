import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import RotaProtegida from "./components/RotaProtegida";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import EscolherPerfil from "./pages/EscolherPerfil";
import Aguardando from "./pages/Aguardando";
import Dashboard from "./pages/Dashboard";
import EmConstrucao from "./pages/EmConstrucao";

function Inicio() {
  const { perfil } = useAuth();

  if (perfil === "dono" || perfil === "funcionario") {
    return <Navigate to="/painel" replace />;
  }
  if (perfil === "cliente") {
    return <Navigate to="/cliente" replace />;
  }
  if (perfil === "entregador") {
    return <Navigate to="/entregador" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route
            path="/escolher-perfil"
            element={
              <RotaProtegida semPerfil>
                <EscolherPerfil />
              </RotaProtegida>
            }
          />
          <Route
            path="/aguardando"
            element={
              <RotaProtegida semPerfil>
                <Aguardando />
              </RotaProtegida>
            }
          />

          <Route
            path="/"
            element={
              <RotaProtegida>
                <Inicio />
              </RotaProtegida>
            }
          />
          <Route
            path="/painel"
            element={
              <RotaProtegida perfis={["dono", "funcionario"]}>
                <Dashboard />
              </RotaProtegida>
            }
          />
          <Route
            path="/cliente"
            element={
              <RotaProtegida perfis={["cliente"]}>
                <EmConstrucao titulo="Área do cliente" />
              </RotaProtegida>
            }
          />
          <Route
            path="/entregador"
            element={
              <RotaProtegida perfis={["entregador"]}>
                <EmConstrucao titulo="Área do entregador" />
              </RotaProtegida>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}