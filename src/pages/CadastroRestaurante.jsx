import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { cnpjValido, formatarCnpj } from "../utils/cnpj";

function traduzirErro(codigo) {
  switch (codigo) {
    case "app/cnpj-ja-cadastrado":
      return "Já existe um restaurante cadastrado com este CNPJ.";
    case "auth/email-already-in-use":
      return "Este e-mail já tem conta. Use a tela de entrar.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/weak-password":
      return "A senha deve ter pelo menos 6 caracteres.";
    case "auth/network-request-failed":
      return "Sem conexão. Verifique sua internet.";
    default:
      return "Não foi possível cadastrar. Tente novamente.";
  }
}

export default function CadastroRestaurante() {
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [nomeDono, setNomeDono] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { cadastrarRestaurante } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!cnpjValido(cnpj)) {
      return setErro("CNPJ inválido. Confira os 14 números.");
    }
    if (senha.length < 6) {
      return setErro("A senha deve ter pelo menos 6 caracteres.");
    }
    if (senha !== confirmar) {
      return setErro("As senhas não coincidem.");
    }

    setEnviando(true);
    try {
      await cadastrarRestaurante({
        nomeRestaurante: nomeRestaurante.trim(),
        cnpj: cnpj.replace(/\D/g, ""),
        nomeDono: nomeDono.trim(),
        email: email.trim(),
        senha,
      });
      navigate("/");
    } catch (err) {
      setErro(traduzirErro(err.code));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 py-4">
      <Card style={{ width: "100%", maxWidth: "460px" }} className="shadow-sm">
        <Card.Body className="p-4">
          <h3 className="text-center mb-1">Conecta Sabor</h3>
          <p className="text-center text-muted mb-4">Cadastro do restaurante</p>

          {erro && <Alert variant="danger">{erro}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="nomeRestaurante">
              <Form.Label>Nome do restaurante</Form.Label>
              <Form.Control
                type="text"
                value={nomeRestaurante}
                onChange={(e) => setNomeRestaurante(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="cnpj">
              <Form.Label>CNPJ</Form.Label>
              <Form.Control
                type="text"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => setCnpj(formatarCnpj(e.target.value))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="nomeDono">
              <Form.Label>Nome do dono ou administrador responsável</Form.Label>
              <Form.Control
                type="text"
                autoComplete="name"
                value={nomeDono}
                onChange={(e) => setNomeDono(e.target.value)}
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

            <Form.Group className="mb-3" controlId="senha">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="confirmar">
              <Form.Label>Confirmar senha</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" className="w-100" disabled={enviando}>
              {enviando ? "Cadastrando..." : "Cadastrar restaurante"}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <Link to="/cadastro">Voltar</Link> · <Link to="/login">Entrar</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}