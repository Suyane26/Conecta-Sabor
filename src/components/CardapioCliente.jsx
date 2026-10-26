import { useEffect, useMemo, useState } from "react";
import { Row, Col, Spinner } from "react-bootstrap";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import ItemCardapio from "./itemCardapio";

export default function CardapioCliente({ restauranteId, onAdicionar }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    const consulta = query(
      collection(db, "cardapio"),
      where("restauranteId", "==", restauranteId),
      where("disponivel", "==", true)
    );

    const cancelar = onSnapshot(
      consulta,
      (snap) => {
        setItens(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao carregar o cardápio:", erro);
        setCarregando(false);
      }
    );

    return cancelar;
  }, [restauranteId]);

  const categorias = useMemo(
    () =>
      [...new Set(itens.map((i) => i.categoria))].sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [itens]
  );

  const temOfertas = itens.some((i) => i.oferta && i.oferta !== "nenhuma");

  const filtroAtivo =
    filtro === "todos" ||
    (filtro === "ofertas" && temOfertas) ||
    categorias.includes(filtro)
      ? filtro
      : "todos";

  const visiveis = itens.filter((i) => {
    if (filtroAtivo === "todos") return true;
    if (filtroAtivo === "ofertas") return i.oferta && i.oferta !== "nenhuma";
    return i.categoria === filtroAtivo;
  });

  const grupos = categorias
    .map((cat) => ({
      categoria: cat,
      lista: visiveis
        .filter((i) => i.categoria === cat)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    }))
    .filter((g) => g.lista.length > 0);

  if (carregando) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <p className="text-muted text-center py-5">
        No momento não há itens disponíveis neste restaurante.
      </p>
    );
  }

  return (
    <>
      <div className="cs-categorias mb-4">
        <button
          type="button"
          className={`cs-chip${filtroAtivo === "todos" ? " ativo" : ""}`}
          onClick={() => setFiltro("todos")}
        >
          Todos
        </button>

        {temOfertas && (
          <button
            type="button"
            className={`cs-chip${filtroAtivo === "ofertas" ? " ativo" : ""}`}
            onClick={() => setFiltro("ofertas")}
          >
            Ofertas e combos
          </button>
        )}

        {categorias.map((cat) => (
          <button
            type="button"
            key={cat}
            className={`cs-chip${filtroAtivo === cat ? " ativo" : ""}`}
            onClick={() => setFiltro(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {grupos.map((g) => (
        <section key={g.categoria} className="mb-4">
          <h2 className="h5 cs-secao-titulo">{g.categoria}</h2>
          <Row className="g-3">
            {g.lista.map((item) => (
              <Col xs={12} md={6} key={item.id}>
                <ItemCardapio item={item} onAdicionar={onAdicionar} />
              </Col>
            ))}
          </Row>
        </section>
      ))}
    </>
  );
}