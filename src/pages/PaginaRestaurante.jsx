import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container, Button, Alert, Spinner } from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { salvarRestauranteAtual } from "../utils/RestauranteAtual";
import CardapioCliente from "../components/CardapioCliente";

export default function PaginaRestaurante() {
  const { restauranteId } = useParams();
  const { usuario, dados, sair } = useAuth();

  const [restaurante, setRestaurante] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDoc(doc(db, "restaurantes", restauranteId));
        if (snap.exists()) {
          setRestaurante(snap.data());
          salvarRestauranteAtual(restauranteId);
        } else {
          setNaoEncontrado(true);
        }
      } catch {
        setNaoEncontrado(true);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [restauranteId]);

  if (carregando) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (naoEncontrado) {
    return (
      <Container className="py-5 text-center" style={{ maxWidth: "460px" }}>
        <h5>Restaurante não encontrado</h5>
        <p className="text-muted">
          Este link não é válido. Peça um novo link ou QR Code ao restaurante.
        </p>
      </Container>
    );
  }

  return (
    <>
      <div className="cs-topo">
        <Container className="d-flex justify-content-between align-items-center py-3">
          <h1 className="h4 mb-0 text-reset">{restaurante.nome}</h1>

          <div className="d-flex gap-2">
            {!usuario ? (
              <>
                <Button as={Link} to="/login" variant="outline-light" size="sm">
                  Entrar
                </Button>
                <Button as={Link} to="/cadastro/cliente" size="sm">
                  Criar conta
                </Button>
              </>
            ) : (
              <>
                {dados && dados.perfil !== "cliente" && (
                  <Button as={Link} to="/" variant="light" size="sm">
                    Ir para o painel
                  </Button>
                )}
                <Button variant="outline-light" size="sm" onClick={sair}>
                  Sair
                </Button>
              </>
            )}
          </div>
        </Container>
      </div>

      <Container className="py-4">
        {aviso && (
          <Alert variant="info" dismissible onClose={() => setAviso("")}>
            {aviso}
          </Alert>
        )}

        <CardapioCliente
          restauranteId={restauranteId}
          onAdicionar={() =>
            setAviso("O carrinho será ativado no próximo passo do projeto.")
          }
        />
      </Container>
    </>
  );
}