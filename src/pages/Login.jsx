import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

function traduzirErro(codigo) {
  switch (codigo) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail ou senha incorretos.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde um pouco e tente novamente.";
    case "auth/popup-blocked":
      return "O navegador bloqueou a janela do Google. Libere os pop-ups e tente de novo.";
    case "auth/network-request-failed":
      return "Sem conexão. Verifique sua internet.";
    default:
      return "Não foi possível entrar. Tente novamente.";
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { entrar, entrarComGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await entrar(email, senha);
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
      await entrarComGoogle();
      navigate("/");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setErro(traduzirErro(err.code));
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Card style={{ width: "100%", maxWidth: "420px" }} className="shadow-sm">
        <Card.Body className="p-4">
          <h3 className="text-center mb-1">Conecta Sabor</h3>
          <p className="text-center text-muted mb-4">Acesse sua conta</p>

          {erro && <Alert variant="danger">{erro}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>E-mail</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="senha">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" className="w-100" disabled={enviando}>
              {enviando ? "Entrando..." : "Entrar"}
            </Button>
          </Form>

          <div className="text-center text-muted my-3">ou</div>

          <Button
            variant="outline-secondary"
            className="w-100"
            onClick={handleGoogle}
            disabled={enviando}
          >
            Entrar com Google
          </Button>

          <div className="text-center mt-3">
            Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}