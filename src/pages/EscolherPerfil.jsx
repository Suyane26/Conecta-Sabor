import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Row, Col } from "react-bootstrap";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const OPCOES = [
  {
    valor: "dono",
    titulo: "Sou dono(a) do restaurante",
    texto: "Cadastre seu restaurante e gerencie tudo.",
  },
  {
    valor: "funcionario",
    titulo: "Sou funcionário(a)",
    texto: "Entre com o código do restaurante onde trabalha.",
  },
  {
    valor: "entregador",
    titulo: "Sou entregador(a)",
    texto: "Entre com o código do restaurante para fazer entregas.",
  },
  {
    valor: "cliente",
    titulo: "Sou cliente",
    texto: "Peça comida e acompanhe seus pedidos.",
  },
];

function gerarCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let sufixo = "";
  for (let i = 0; i < 4; i++) {
    sufixo += letras[Math.floor(Math.random() * letras.length)];
  }
  return `SABOR-${sufixo}`;
}

export default function EscolherPerfil() {
  const { usuario, dados, recarregar, sair } = useAuth();

  const [escolha, setEscolha] = useState("");
  const [nome, setNome] = useState(usuario.displayName || "");
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (dados) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);

    try {
      const refUsuario = doc(db, "usuarios", usuario.uid);
      const base = {
        nome: nome.trim(),
        email: usuario.email,
        perfil: escolha,
        criadoEm: serverTimestamp(),
      };

      if (escolha === "dono") {
        const refRestaurante = doc(collection(db, "restaurantes"));
        const lote = writeBatch(db);
        lote.set(refRestaurante, {
          nome: nomeRestaurante.trim(),
          endereco: endereco.trim(),
          telefone: telefone.trim(),
          donoId: usuario.uid,
          codigoConvite: gerarCodigo(),
          criadoEm: serverTimestamp(),
        });
        lote.set(refUsuario, {
          ...base,
          restauranteId: refRestaurante.id,
          status: "ativo",
        });
        await lote.commit();
      } else if (escolha === "cliente") {
        await setDoc(refUsuario, { ...base, restauranteId: null, status: "ativo" });
      } else {
        const consulta = query(
          collection(db, "restaurantes"),
          where("codigoConvite", "==", codigo.trim().toUpperCase()),
          limit(1)
        );
        const resultado = await getDocs(consulta);

        if (resultado.empty) {
          setErro("Código não encontrado. Confira com o dono do restaurante.");
          return;
        }

        await setDoc(refUsuario, {
          ...base,
          restauranteId: resultado.docs[0].id,
          status: "pendente",
        });
      }

      await recarregar();
    } catch (err) {
      console.error(err);
      setErro("Não foi possível concluir. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container className="py-5" style={{ maxWidth: "720px" }}>
      <h3 className="text-center mb-1">Conecta Sabor</h3>
      <p className="text-center text-muted mb-4">Quem é você?</p>

      <Row className="g-3 mb-4">
        {OPCOES.map((o) => (
          <Col xs={12} md={6} key={o.valor}>
            <Card
              role="button"
              className={`h-100 ${escolha === o.valor ? "border-primary border-2" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => setEscolha(o.valor)}
            >
              <Card.Body>
                <Card.Title className="fs-6">{o.titulo}</Card.Title>
                <Card.Text className="text-muted small mb-0">{o.texto}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {erro && <Alert variant="danger">{erro}</Alert>}

      {escolha && (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="nome">
            <Form.Label>Seu nome</Form.Label>
            <Form.Control
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </Form.Group>

          {escolha === "dono" && (
            <>
              <Form.Group className="mb-3" controlId="nomeRestaurante">
                <Form.Label>Nome do restaurante</Form.Label>
                <Form.Control
                  type="text"
                  value={nomeRestaurante}
                  onChange={(e) => setNomeRestaurante(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="endereco">
                <Form.Label>Endereço</Form.Label>
                <Form.Control
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="telefone">
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              </Form.Group>
            </>
          )}

          {(escolha === "funcionario" || escolha === "entregador") && (
            <Form.Group className="mb-3" controlId="codigo">
              <Form.Label>Código do restaurante</Form.Label>
              <Form.Control
                type="text"
                placeholder="SABOR-XXXX"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Peça o código ao dono do restaurante. Seu acesso será liberado
                depois da aprovação dele.
              </Form.Text>
            </Form.Group>
          )}

          <Button type="submit" className="w-100" disabled={enviando}>
            {enviando ? "Salvando..." : "Continuar"}
          </Button>
        </Form>
      )}

      <div className="text-center mt-4">
        <Button variant="link" onClick={sair}>
          Sair
        </Button>
      </div>
    </Container>
  );
}