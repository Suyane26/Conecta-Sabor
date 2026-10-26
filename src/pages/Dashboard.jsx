import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  InputGroup,
} from "react-bootstrap";
import { QRCodeCanvas } from "qrcode.react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const FUNCIONALIDADES = {
  dono: [
    { nome: "Gestão de cardápio", rota: "/painel/cardapio" },
    { nome: "Painel de pedidos", rota: "/painel/pedidos" },
    { nome: "Mesas", rota: "/painel/mesas" },
    { nome: "Cozinha", rota: "/painel/cozinha" },
    { nome: "Relatórios" },
  ],
  funcionario: [
    { nome: "Disponibilidade do cardápio", rota: "/painel/cardapio" },
    { nome: "Painel de pedidos", rota: "/painel/pedidos" },
    { nome: "Mesas", rota: "/painel/mesas" },
  ],
  cozinha: [
    { nome: "Cozinha", rota: "/painel/cozinha" },
    { nome: "Cardápio", rota: "/painel/cardapio" },
  ],
};

const ROTULOS = { dono: "Dono(a)", funcionario: "Salão", cozinha: "Cozinha" };

const LINKS_EQUIPE = [
  { tipo: "funcionario", rotulo: "Funcionários do salão (garçons e atendimento)" },
  { tipo: "cozinha", rotulo: "Cozinha" },
  { tipo: "entregador", rotulo: "Entregadores" },
];

export default function Dashboard() {
  const { usuario, dados, sair } = useAuth();
  const [restaurante, setRestaurante] = useState(null);
  const [copiado, setCopiado] = useState("");
  const qrRef = useRef(null);

  useEffect(() => {
    async function carregar() {
      if (!dados.restauranteId) return;
      const snap = await getDoc(doc(db, "restaurantes", dados.restauranteId));
      if (snap.exists()) setRestaurante(snap.data());
    }
    carregar();
  }, [dados.restauranteId]);

  function linkDe(tipo) {
    const base = window.location.origin;
    if (tipo === "clientes") return `${base}/r/${dados.restauranteId}`;
    return `${base}/convite/${dados.restauranteId}/${tipo}`;
  }

  async function copiar(tipo) {
    try {
      await navigator.clipboard.writeText(linkDe(tipo));
      setCopiado(tipo);
      setTimeout(() => setCopiado(""), 2000);
    } catch {
      window.prompt("Copie o link:", linkDe(tipo));
    }
  }

  function baixarQr() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "qrcode-restaurante.png";
    a.click();
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="mb-1">
            {restaurante ? restaurante.nome : "Painel do restaurante"}
          </h2>
          <p className="mb-0">
            {dados.nome} <Badge bg="secondary">{ROTULOS[dados.perfil]}</Badge>
          </p>
          <small className="text-muted">{usuario.email}</small>
        </div>
        <Button variant="outline-danger" onClick={sair}>
          Sair
        </Button>
      </div>

      {dados.perfil === "dono" && (
        <>
          <Card className="mb-4">
            <Card.Header>Link e QR Code para seus clientes</Card.Header>
            <Card.Body>
              <Row className="align-items-center g-3">
                <Col xs={12} md={8}>
                  <p className="text-muted small">
                    Divulgue este link (Instagram, WhatsApp) ou cole o QR Code nas
                    mesas e no balcão. Quem abrir cai direto no seu restaurante.
                  </p>
                  <InputGroup>
                    <Form.Control readOnly value={linkDe("clientes")} />
                    <Button variant="outline-primary" onClick={() => copiar("clientes")}>
                      {copiado === "clientes" ? "Copiado!" : "Copiar"}
                    </Button>
                  </InputGroup>
                </Col>
                <Col xs={12} md={4} className="text-center">
                  <div ref={qrRef} className="d-inline-block">
                    <QRCodeCanvas value={linkDe("clientes")} size={160} marginSize={2} />
                  </div>
                  <div>
                    <Button variant="link" size="sm" onClick={baixarQr}>
                      Baixar QR Code
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>Links de cadastro da equipe</Card.Header>
            <Card.Body>
              <p className="text-muted small">
                Envie cada link para a pessoa certa. Quem se cadastrar por ele passa
                a fazer parte da sua equipe, com o acesso daquela função.
              </p>

              {LINKS_EQUIPE.map((l, i) => (
                <div key={l.tipo} className={i < LINKS_EQUIPE.length - 1 ? "mb-3" : ""}>
                  <Form.Label className="mb-1">{l.rotulo}</Form.Label>
                  <InputGroup>
                    <Form.Control readOnly value={linkDe(l.tipo)} />
                    <Button variant="outline-primary" onClick={() => copiar(l.tipo)}>
                      {copiado === l.tipo ? "Copiado!" : "Copiar"}
                    </Button>
                  </InputGroup>
                </div>
              ))}
            </Card.Body>
          </Card>
        </>
      )}

      <h5 className="mb-3">Funcionalidades</h5>
      <Row className="g-3">
        {FUNCIONALIDADES[dados.perfil].map((f) => (
          <Col xs={12} md={4} key={f.nome}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title className="fs-6">{f.nome}</Card.Title>
                {f.rota ? (
                  <Button as={Link} to={f.rota} size="sm">
                    Abrir
                  </Button>
                ) : (
                  <Badge bg="light" text="dark">
                    Em breve
                  </Badge>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}