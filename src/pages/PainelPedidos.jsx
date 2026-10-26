import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Button } from "react-bootstrap";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import QuadroPedidos from "../components/QuadroPedidos";
import NovoPedido from "../components/NovoPedido";

const COLUNAS = [
  { status: "recebido", titulo: "Recebido" },
  { status: "em_preparo", titulo: "Em preparo" },
  { status: "pronto", titulo: "Pronto" },
  { status: "saiu_entrega", titulo: "Saiu para entrega" },
];

export default function PainelPedidos() {
  const { dados } = useAuth();
  const restauranteId = dados.restauranteId;

  const [entregadores, setEntregadores] = useState([]);
  const [mostrarNovo, setMostrarNovo] = useState(false);

  useEffect(() => {
    const consulta = query(
      collection(db, "usuarios"),
      where("restauranteId", "==", restauranteId),
      where("perfil", "==", "entregador")
    );

    return onSnapshot(
      consulta,
      (snap) =>
        setEntregadores(snap.docs.map((d) => ({ id: d.id, nome: d.data().nome }))),
      (e) => console.error("Erro ao carregar entregadores:", e)
    );
  }, [restauranteId]);

  return (
    <Container fluid className="py-4 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <Link to="/painel" className="small">
            &larr; Voltar ao painel
          </Link>
          <h2 className="mb-0">Painel de pedidos</h2>
        </div>
        <Button onClick={() => setMostrarNovo(true)}>Novo pedido (balcão ou telefone)</Button>
      </div>

      <QuadroPedidos
        restauranteId={restauranteId}
        perfil={dados.perfil}
        colunas={COLUNAS}
        entregadores={entregadores}
        mostrarTotal
      />

      <NovoPedido
        show={mostrarNovo}
        onHide={() => setMostrarNovo(false)}
        restauranteId={restauranteId}
      />
    </Container>
  );
}