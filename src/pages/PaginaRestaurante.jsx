import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container, Button, Alert, Spinner } from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { salvarRestauranteAtual } from "../utils/RestauranteAtual";
import { formatarPreco } from "../utils/formatar";
import { precoEfetivo } from "../utils/pedidos";
import CardapioCliente from "../components/CardapioCliente";
import CarrinhoCliente from "../components/CarrinhoCliente";

export default function PaginaRestaurante() {
  const { restauranteId } = useParams();
  const { usuario, dados, sair } = useAuth();

  const [restaurante, setRestaurante] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [aviso, setAviso] = useState("");
  
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);

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

  function adicionarAoCarrinho(item) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === item.id);
      if (existe) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { ...item, quantidade: 1, observacao: "" }];
    });
    setAviso(`${item.nome} adicionado ao carrinho!`);
    setTimeout(() => setAviso(""), 3000);
  }

  const totalCarrinho = carrinho.reduce((soma, i) => soma + precoEfetivo(i) * i.quantidade, 0);
  const qtdItens = carrinho.reduce((soma, i) => soma + i.quantidade, 0);

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

      <Container className="py-4 position-relative">
        {aviso && (
          <Alert variant="success" dismissible onClose={() => setAviso("")}>
            {aviso}
          </Alert>
        )}

        <CardapioCliente
          restauranteId={restauranteId}
          onAdicionar={adicionarAoCarrinho}
        />

        {carrinho.length > 0 && (
          <div className="cs-btn-flutuante">
            <Button 
              variant="primary" 
              className="w-100 d-flex justify-content-between align-items-center py-3 fw-bold"
              onClick={() => setMostrarCarrinho(true)}
            >
              <span>{qtdItens} {qtdItens === 1 ? "item" : "itens"}</span>
              <span>Ver Carrinho</span>
              <span>{formatarPreco(totalCarrinho)}</span>
            </Button>
          </div>
        )}

        <CarrinhoCliente
          show={mostrarCarrinho}
          onHide={() => setMostrarCarrinho(false)}
          restauranteId={restauranteId}
          carrinho={carrinho}
          setCarrinho={setCarrinho}
          onFinalizado={() => {
            setAviso("Pedido enviado com sucesso! Acompanhe pelo restaurante.");
            setTimeout(() => setAviso(""), 5000);
          }}
        />
      </Container>
    </>
  );
}