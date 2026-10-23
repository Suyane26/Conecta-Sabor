import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

function traduzirErro(codigo) {
  switch (codigo) {
    case "auth/email-already-in-use":
      return "Este e-mail já está cadastrado.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/weak-password":
      return "A senha deve ter pelo menos 6 caracteres.";
    default:
      return "Não foi possível cadastrar. Tente novamente.";
  }
}

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { cadastrar } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      return setErro("A senha deve ter pelo menos 6 caracteres.");
    }
    if (senha !== confirmar) {
      return setErro("As senhas não coincidem.");
    }

    setEnviando(true);
    try {
      await cadastrar(nome, email, senha);
      navigate("/");
    } catch (err) {
      setErro(traduzirErro(err.code));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Card style={{ width: "100%", maxWidth: "420px" }} className="shadow-sm">
        <Card.Body className="p-4">
          <h3 className="text-center mb-1">Conecta Sabor</h3>
          <p className="text-center text-muted mb-4">Crie sua conta</p>

          {erro && <Alert variant="danger">{erro}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="nome">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="email">
              <Form.Label>E-mail</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="senha">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="confirmar">
              <Form.Label>Confirmar senha</Form.Label>
              <Form.Control
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" className="w-100" disabled={enviando}>
              {enviando ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </Form>

          <div className="text-center mt-3">
            Já tem conta? <Link to="/login">Entrar</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}