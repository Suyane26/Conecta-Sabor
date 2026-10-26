import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const ROTULOS = {
  cliente: "Cliente",
  funcionario: "Funcionário(a) do salão",
  entregador: "Entregador(a)",
  cozinha: "Cozinha",
};

function traduzirErro(codigo) {
  switch (codigo) {
    case "auth/email-already-in-use":
      return "Este e-mail já tem conta. Use a tela de entrar.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/weak-password":
      return "A senha deve ter pelo menos 6 caracteres.";
    case "auth/popup-blocked":
      return "O navegador bloqueou a janela do Google. Libere os pop-ups e tente de novo.";
    case "auth/network-request-failed":
      return "Sem conexão. Verifique sua internet.";
    default:
      return "Não foi possível cadastrar. Tente novamente.";
  }
}

export default function CadastroUsuario({ tipo: tipoFixo }) {
  const params = useParams();
  const tipo = tipoFixo || params.tipo;
  const restauranteId = params.restauranteId || null;

  const tipoValido =
  tipo === "cliente"
    ? !restauranteId
    : ["funcionario", "entregador", "cozinha"].includes(tipo) &&
      Boolean(restauranteId);

  const [restaurante, setRestaurante] = useState(null);
  const [verificandoLink, setVerificandoLink] = useState(Boolean(restauranteId));
  const [linkInvalido, setLinkInvalido] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { cadastrarUsuario, cadastrarComGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!restauranteId) return;
    async function verificar() {
      try {
        const snap = await getDoc(doc(db, "restaurantes", restauranteId));
        if (snap.exists()) setRestaurante(snap.data());
        else setLinkInvalido(true);
      } catch {
        setLinkInvalido(true);
      } finally {
        setVerificandoLink(false);
      }
    }
    verificar();
  }, [restauranteId]);

  if (!tipoValido || linkInvalido) {
    return (
      <Container className="py-5 text-center" style={{ maxWidth: "460px" }}>
        <h5>Link inválido</h5>
        <p className="text-muted">
          Este link de cadastro não é válido. Peça um novo link ao restaurante.
        </p>
        <Link to="/login">Ir para o login</Link>
      </Container>
    );
  }

  if (verificandoLink) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      return setErro("A senha deve ter pelo menos 6 caracteres.");
    }

    setEnviando(true);
    try {
      await cadastrarUsuario({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        perfil: tipo,
        restauranteId,
      });
      navigate("/");
    } catch (err) {
      setErro(traduzirErro(err.code));
    } finally {
      setEnviando(false);
    }
  }

  async function handleGoogle() {
    setErro("");
    setEnviando(true);
    try {
      await cadastrarComGoogle({ perfil: tipo, restauranteId });
      navigate("/");
    } catch (err) {
      if (
        err.code !== "auth/popup-closed-by-user" &&
        err.code !== "auth/cancelled-popup-request"
      ) {
        setErro(traduzirErro(err.code));
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 py-4">
      <Card style={{ width: "100%", maxWidth: "420px" }} className="shadow-sm">
        <Card.Body className="p-4">
          <h3 className="text-center mb-1">Conecta Sabor</h3>
          <p className="text-center text-muted mb-4">
            {restaurante
              ? `Cadastro de ${ROTULOS[tipo]} em ${restaurante.nome}`
              : `Cadastro de ${ROTULOS[tipo]}`}
          </p>

          {erro && <Alert variant="danger">{erro}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="nome">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="email">
              <Form.Label>E-mail</Form.Label>
              <Form.Control
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="senha">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <Form.Text className="text-muted">Mínimo de 6 caracteres.</Form.Text>
            </Form.Group>

            <Button type="submit" className="w-100" disabled={enviando}>
              {enviando ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </Form>

          <div className="text-center text-muted my-3">ou</div>

          <Button
            variant="outline-secondary"
            className="w-100"
            onClick={handleGoogle}
            disabled={enviando}
          >
            Cadastrar com Google
          </Button>

          <div className="text-center mt-3">
            Já tem conta? <Link to="/login">Entrar</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}