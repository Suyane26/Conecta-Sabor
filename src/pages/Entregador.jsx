import { useState, useEffect } from "react";
import { Container, Button, Card, Badge, Tabs, Tab } from "react-bootstrap";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { formatarPreco } from "../utils/formatar";

export default function Entregador() {
  const { usuario, dados, sair } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("novas");

  useEffect(() => {
    if (!dados?.restauranteId) return;

    // Procura apenas pedidos de "entrega" que estejam prontos ou já em rota
    const q = query(
      collection(db, "pedidos"),
      where("restauranteId", "==", dados.restauranteId),
      where("tipo", "==", "entrega"),
      where("status", "in", ["pronto", "saiu_entrega"])
    );

    const cancelar = onSnapshot(q, (snap) => {
      const lista = [];
      snap.forEach((documento) => lista.push({ id: documento.id, ...documento.data() }));
      lista.sort((a, b) => (a.criadoEm?.toMillis() || 0) - (b.criadoEm?.toMillis() || 0));
      setPedidos(lista);
    });

    return cancelar;
  }, [dados]);

  async function aceitarEntrega(pedido) {
    try {
      await updateDoc(doc(db, "pedidos", pedido.id), {
        status: "saiu_entrega",
        entregadorId: usuario.uid,
        entregadorNome: dados.nome,
        statusAtualizadoEm: serverTimestamp()
      });
      setAbaAtiva("minhas"); // Muda automaticamente para o separador das rotas
    } catch (error) {
      alert("Erro ao aceitar a entrega.");
    }
  }

  async function finalizarEntrega(pedidoId) {
    if (!window.confirm("Confirmar que o pedido foi entregue ao cliente?")) return;
    try {
      await updateDoc(doc(db, "pedidos", pedidoId), {
        status: "finalizado",
        statusAtualizadoEm: serverTimestamp()
      });
    } catch (error) {
      alert("Erro ao finalizar a entrega.");
    }
  }

  function abrirMapa(endereco) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    window.open(url, "_blank");
  }

  const disponiveis = pedidos.filter(p => p.status === "pronto");
  const minhas = pedidos.filter(p => p.status === "saiu_entrega" && p.entregadorId === usuario.uid);

  return (
    <div style={{ backgroundColor: "#f4f4f4", minHeight: "100vh", paddingBottom: "2rem" }}>
      {/* Cabeçalho */}
      <div className="bg-primary text-white shadow-sm sticky-top">
        <Container className="d-flex justify-content-between align-items-center py-3">
          <div>
            <h5 className="mb-0 fw-bold">Área do Entregador</h5>
            <small>{dados?.nome}</small>
          </div>
          <Button variant="outline-light" size="sm" onClick={sair}>Sair</Button>
        </Container>
      </div>

      {/* Conteúdo com Separadores (Tabs) */}
      <Container className="mt-3">
        <Tabs activeKey={abaAtiva} onSelect={(k) => setAbaAtiva(k)} className="mb-3 bg-white p-2 rounded shadow-sm">
          
          <Tab eventKey="novas" title={`Disponíveis (${disponiveis.length})`}>
            {disponiveis.length === 0 ? (
              <p className="text-center text-muted mt-5">Nenhuma entrega a aguardar no momento.</p>
            ) : (
              disponiveis.map(p => (
                <Card key={p.id} className="mb-3 border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-2">
                      <strong className="text-dark">Pedido #{p.id.slice(-4).toUpperCase()}</strong>
                      <Badge bg="warning" text="dark">Aguardar Retirada</Badge>
                    </div>
                    <p className="mb-1 small"><strong>Cliente:</strong> {p.clienteNome}</p>
                    <p className="mb-2 small"><strong>Endereço:</strong> {p.endereco}</p>
                    <p className="mb-3 small fw-bold">Total: {formatarPreco(p.total)}</p>
                    <Button variant="primary" className="w-100 fw-bold" onClick={() => aceitarEntrega(p)}>
                      Aceitar e Iniciar Entrega
                    </Button>
                  </Card.Body>
                </Card>
              ))
            )}
          </Tab>
          
          <Tab eventKey="minhas" title={`Minhas Rotas (${minhas.length})`}>
            {minhas.length === 0 ? (
              <p className="text-center text-muted mt-5">Não tens entregas em andamento.</p>
            ) : (
              minhas.map(p => (
                <Card key={p.id} className="mb-3 border-0 shadow-sm border-start border-primary border-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-2">
                      <strong className="text-dark">Pedido #{p.id.slice(-4).toUpperCase()}</strong>
                      <Badge bg="primary">Em Rota</Badge>
                    </div>
                    <p className="mb-1 small"><strong>Cliente:</strong> {p.clienteNome}</p>
                    <p className="mb-1 small"><strong>Telefone:</strong> {p.clienteTelefone || "Não informado"}</p>
                    <p className="mb-2 small"><strong>Endereço:</strong> {p.endereco}</p>
                    
                    {p.observacoes && (
                      <div className="bg-light p-2 mb-2 rounded small text-danger">
                        <strong>Obs:</strong> {p.observacoes}
                      </div>
                    )}
                    
                    <div className="d-flex gap-2 mt-3">
                      <Button variant="outline-secondary" className="w-50 fw-bold" onClick={() => abrirMapa(p.endereco)}>
                        📍 Mapa
                      </Button>
                      <Button variant="success" className="w-50 fw-bold" onClick={() => finalizarEntrega(p.id)}>
                        ✓ Entregue
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))
            )}
          </Tab>
          
        </Tabs>
      </Container>
    </div>
  );
}