import { useEffect, useState } from "react";
import { Toast, ToastContainer } from "react-bootstrap";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

export default function AlertaNotificacao() {
  const { usuario, dados } = useAuth();
  const [mensagens, setMensagens] = useState([]);

  useEffect(() => {
    if (!usuario || !dados) return;

    let q;
    const agora = Date.now();

    // Se for dono ou cozinha, escuta novos pedidos do restaurante
    if (["dono", "funcionario", "cozinha"].includes(dados.perfil) && dados.restauranteId) {
      q = query(
        collection(db, "pedidos"),
        where("restauranteId", "==", dados.restauranteId),
        orderBy("criadoEm", "desc"),
        limit(1)
      );
    } 
    // Se for entregador, escuta pedidos prontos
    else if (dados.perfil === "entregador" && dados.restauranteId) {
      q = query(
        collection(db, "pedidos"),
        where("restauranteId", "==", dados.restauranteId),
        where("status", "==", "pronto"),
        orderBy("criadoEm", "desc"),
        limit(1)
      );
    }

    if (!q) return;

    let primeiroCarregamento = true;
    const cancelar = onSnapshot(q, (snapshot) => {
      if (primeiroCarregamento) {
        primeiroCarregamento = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const pedido = change.data();
          // Só alerta se o pedido foi criado nos últimos 15 segundos
          if (pedido.criadoEm && (agora - pedido.criadoEm.toMillis() < 15000)) {
            dispararAlerta(`Novo pedido #${change.doc.id.slice(-4).toUpperCase()} recebido! Total: R$ ${pedido.total?.toFixed(2)}`);
          }
        }
      });
    });

    return cancelar;
  }, [usuario, dados]);

  function dispararAlerta(texto) {
    const id = Date.now();
    setMensagens((prev) => [...prev, { id, texto }]);
    setTimeout(() => {
      setMensagens((prev) => prev.filter((m) => m.id !== id));
    }, 6000);
  }

  return (
    <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 1080 }}>
      {mensagens.map((m) => (
        <Toast key={m.id} bg="dark" text="white" className="shadow-lg">
          <Toast.Header closeButton={false} className="bg-warning text-dark fw-bold">
            <strong className="me-auto">🔔 Notificação Conecta Sabor</strong>
          </Toast.Header>
          <Toast.Body>{m.texto}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}