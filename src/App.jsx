import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import RotaProtegida from "./components/RotaProtegida";
import { lerRestauranteAtual } from "./utils/RestauranteAtual";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import CadastroRestaurante from "./pages/CadastroRestaurante";
import CadastroUsuario from "./pages/CadastroUsuario";
import PaginaRestaurante from "./pages/PaginaRestaurante";
import ClienteInicio from "./pages/ClienteInicio";
import Dashboard from "./pages/Dashboard";
import GestaoCardapio from "./pages/GestaoCardapio";
import PainelPedidos from "./pages/PainelPedidos";
import Mesas from "./pages/Mesas";
import Cozinha from "./pages/Cozinha";
import EmConstrucao from "./pages/EmConstrucao";

function Destino() {
  const { perfil } = useAuth();

  if (["dono", "funcionario", "cozinha"].includes(perfil)) {
    return <Navigate to="/painel" replace />;
  }
  if (perfil === "cliente") {
    const ultimo = lerRestauranteAtual();
    return <Navigate to={ultimo ? `/r/${ultimo}` : "/cliente"} replace />;
  }
  if (perfil === "entregador") {
    return <Navigate to="/entregador" replace />;
  }
  return <Navigate to="/login" replace />;
}

function Inicio() {
  const { usuario } = useAuth();

  if (!usuario) {
    const ultimo = lerRestauranteAtual();
    return <Navigate to={ultimo ? `/r/${ultimo}` : "/login"} replace />;
  }

  return (
    <RotaProtegida>
      <Destino />
    </RotaProtegida>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/cadastro/restaurante" element={<CadastroRestaurante />} />
          <Route path="/cadastro/cliente" element={<CadastroUsuario tipo="cliente" />} />
          <Route path="/convite/:restauranteId/:tipo" element={<CadastroUsuario />} />
          <Route path="/r/:restauranteId" element={<PaginaRestaurante />} />

          <Route path="/" element={<Inicio />} />

          <Route
            path="/painel"
            element={
              <RotaProtegida perfis={["dono", "funcionario", "cozinha"]}>
                <Dashboard />
              </RotaProtegida>
            }
          />
          <Route
            path="/painel/cardapio"
            element={
              <RotaProtegida perfis={["dono", "funcionario", "cozinha"]}>
                <GestaoCardapio />
              </RotaProtegida>
            }
          />
          <Route
            path="/painel/pedidos"
            element={
              <RotaProtegida perfis={["dono", "funcionario"]}>
                <PainelPedidos />
              </RotaProtegida>
            }
          />
          <Route
            path="/painel/mesas"
            element={
              <RotaProtegida perfis={["dono", "funcionario"]}>
                <Mesas />
              </RotaProtegida>
            }
          />
          <Route
            path="/painel/cozinha"
            element={
              <RotaProtegida perfis={["dono", "cozinha"]}>
                <Cozinha />
              </RotaProtegida>
            }
          />

          <Route
            path="/cliente"
            element={
              <RotaProtegida perfis={["cliente"]}>
                <ClienteInicio />
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