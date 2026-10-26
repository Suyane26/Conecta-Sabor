import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
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
    case "app/sem-cadastro":
      return "Não encontramos um cadastro para esta conta. Toque em Criar conta e escolha o seu tipo de usuário.";
    default:
      return "Não foi possível entrar. Tente novamente.";
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { usuario, dados, entrar, entrarComGoogle, redefinirSenha } = useAuth();
  const navigate = useNavigate();

  if (usuario && dados) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setInfo("");
    setEnviando(true);
    try {
      await entrar(email.trim(), senha, lembrar);
      navigate("/");
    } catch (err) {
      setErro(traduzirErro(err.code));
    } finally {
      setEnviando(false);
    }
  }

  async function handleGoogle() {
    setErro("");
    setInfo("");
    setEnviando(true);
    try {
      await entrarComGoogle(lembrar);
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

  async function handleRedefinir() {
    setErro("");
    setInfo("");
    if (!email.trim()) {
      return setErro("Digite seu e-mail no campo acima para receber o link de redefinição.");
    }
    try {
      await redefinirSenha(email.trim());
      setInfo(
        "Se existir uma conta com este e-mail, enviamos um link para redefinir a senha. Confira também a caixa de spam."
      );
    } catch (err) {
      setErro(traduzirErro(err.code));
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Card style={{ width: "100%", maxWidth: "420px" }} className="shadow-sm">
        <Card.Body className="p-4">
          <h3 className="text-center mb-1">Conecta Sabor</h3>
          <p className="text-center text-muted mb-4">Acesse sua conta</p>

          {erro && <Alert variant="danger">{erro}</Alert>}
          {info && <Alert variant="success">{info}</Alert>}

          <Form onSubmit={handleSubmit}>
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

            <Form.Group className="mb-3" controlId="senha">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <Form.Check
                type="checkbox"
                id="lembrar"
                label="Manter conectado"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
              />
              <Button variant="link" className="p-0" onClick={handleRedefinir}>
                Esqueci minha senha
              </Button>
            </div>

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
            Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}