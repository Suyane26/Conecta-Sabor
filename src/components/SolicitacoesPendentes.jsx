import { useEffect, useState } from "react";
import { Card, ListGroup, Button, Badge } from "react-bootstrap";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export default function SolicitacoesPendentes({ restauranteId }) {
  const [pendentes, setPendentes] = useState([]);

  useEffect(() => {
    const consulta = query(
      collection(db, "usuarios"),
      where("restauranteId", "==", restauranteId),
      where("status", "==", "pendente")
    );

    const cancelar = onSnapshot(consulta, (snap) => {
      setPendentes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return cancelar;
  }, [restauranteId]);

  async function aprovar(id) {
    await updateDoc(doc(db, "usuarios", id), { status: "ativo" });
  }

  async function recusar(id) {
    await deleteDoc(doc(db, "usuarios", id));
  }

  return (
    <Card>
      <Card.Header>Solicitações de acesso</Card.Header>
      {pendentes.length === 0 ? (
        <Card.Body className="text-muted">Nenhuma solicitação pendente.</Card.Body>
      ) : (
        <ListGroup variant="flush">
          {pendentes.map((p) => (
            <ListGroup.Item
              key={p.id}
              className="d-flex justify-content-between align-items-center"
            >
              <div>
                <strong>{p.nome}</strong>{" "}
                <Badge bg="secondary">
                  {p.perfil === "entregador" ? "Entregador(a)" : "Funcionário(a)"}
                </Badge>
                <div className="small text-muted">{p.email}</div>
              </div>
              <div className="d-flex gap-2">
                <Button size="sm" variant="success" onClick={() => aprovar(p.id)}>
                  Aprovar
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => recusar(p.id)}>
                  Recusar
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Card>
  );
}