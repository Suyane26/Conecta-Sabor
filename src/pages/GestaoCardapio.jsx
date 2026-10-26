import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Button, Modal, Form, Alert, Spinner } from "react-bootstrap";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import ItemCardapio from "../components/itemCardapio";
import { comprimirImagem } from "../utils/imagem";

const CATEGORIAS_SUGERIDAS = ["Pratos", "Lanches", "Bebidas", "Sobremesas", "Porções"];

const FORM_VAZIO = {
  nome: "",
  descricao: "",
  preco: "",
  categoria: "",
  oferta: "nenhuma",
  precoPromocional: "",
  disponivel: true,
  imagemUrl: "",
};

export default function GestaoCardapio() {
  const { dados } = useAuth();
  const restauranteId = dados.restauranteId;
  const podeEditar = dados.perfil === "dono" || dados.perfil === "cozinha";
const podeExcluir = dados.perfil === "dono";

  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState(false);

  useEffect(() => {
    const consulta = query(
      collection(db, "cardapio"),
      where("restauranteId", "==", restauranteId)
    );

    const cancelar = onSnapshot(
      consulta,
      (snap) => {
        setItens(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCarregando(false);
      },
      (e) => {
        console.error("Erro ao carregar o cardápio:", e);
        setCarregando(false);
      }
    );

    return cancelar;
  }, [restauranteId]);

  const categoriasExistentes = [...new Set(itens.map((i) => i.categoria))];
  const sugestoes = [...new Set([...CATEGORIAS_SUGERIDAS, ...categoriasExistentes])];

  const grupos = [...categoriasExistentes]
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((cat) => ({
      categoria: cat,
      lista: itens
        .filter((i) => i.categoria === cat)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    }));

  function atualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function abrirNovo() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErro("");
    setMostrarForm(true);
  }

  function abrirEdicao(item) {
    setEditandoId(item.id);
    setForm({
      nome: item.nome,
      descricao: item.descricao || "",
      preco: String(item.preco),
      categoria: item.categoria,
      oferta: item.oferta || "nenhuma",
      precoPromocional:
        item.precoPromocional != null ? String(item.precoPromocional) : "",
      disponivel: item.disponivel !== false,
      imagemUrl: item.imagemUrl || "",
    });
    setErro("");
    setMostrarForm(true);
  }

  async function escolherFoto(e) {
    const arquivo = e.target.files[0];
    e.target.value = "";
    if (!arquivo) return;

    setErro("");
    setProcessandoFoto(true);
    try {
      atualizar("imagemUrl", await comprimirImagem(arquivo));
    } catch (err) {
      setErro(err.message);
    } finally {
      setProcessandoFoto(false);
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setErro("");

    const preco = Number(form.preco);
    const promocional = Number(form.precoPromocional);

    if (!(preco > 0)) {
      return setErro("Informe um preço maior que zero.");
    }
    if (form.oferta === "promocao" && !(promocional > 0 && promocional < preco)) {
      return setErro(
        "O preço promocional deve ser maior que zero e menor que o preço normal."
      );
    }

    setSalvando(true);
    try {
      const item = {
        restauranteId,
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        preco,
        precoPromocional: form.oferta === "promocao" ? promocional : null,
        categoria: form.categoria.trim(),
        oferta: form.oferta,
        disponivel: form.disponivel,
        imagemUrl: form.imagemUrl,
        atualizadoEm: serverTimestamp(),
      };

      if (editandoId) {
        await updateDoc(doc(db, "cardapio", editandoId), item);
      } else {
        await addDoc(collection(db, "cardapio"), {
          ...item,
          criadoEm: serverTimestamp(),
        });
      }
      setMostrarForm(false);
    } catch (err) {
      console.error(err);
      setErro("Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarDisponivel(item) {
    setAviso("");
    try {
      await updateDoc(doc(db, "cardapio", item.id), {
        disponivel: item.disponivel === false,
      });
    } catch (err) {
      console.error(err);
      setAviso("Não foi possível atualizar a disponibilidade.");
    }
  }

  async function excluir(item) {
    if (!window.confirm(`Excluir "${item.nome}" do cardápio?`)) return;
    setAviso("");
    try {
      await deleteDoc(doc(db, "cardapio", item.id));
    } catch (err) {
      console.error(err);
      setAviso("Não foi possível excluir o item.");
    }
  }

  return (
    <Container className="py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <Link to="/painel" className="small">
            &larr; Voltar ao painel
          </Link>
          <h2 className="mb-0">
            {podeEditar ? "Gestão de cardápio" : "Disponibilidade do cardápio"}
          </h2>
        </div>

        <div className="d-flex gap-2">
          <Button
            as="a"
            href={`/r/${restauranteId}`}
            target="_blank"
            rel="noreferrer"
            variant="outline-secondary"
          >
            Ver como cliente
          </Button>
          {podeEditar && <Button onClick={abrirNovo}>Novo item</Button>}
        </div>
      </div>

      {aviso && (
        <Alert variant="danger" dismissible onClose={() => setAviso("")}>
          {aviso}
        </Alert>
      )}

      {carregando ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : itens.length === 0 ? (
        <p className="text-muted text-center py-5">
          Nenhum item no cardápio ainda.
          {podeEditar && " Clique em Novo item para começar."}
        </p>
      ) : (
        grupos.map((g) => (
          <section key={g.categoria} className="mb-4">
            <h3 className="h5 cs-secao-titulo">{g.categoria}</h3>
            <Row className="g-3">
              {g.lista.map((item) => (
                <Col xs={12} md={6} key={item.id}>
                  <ItemCardapio
                    item={item}
                    acoes={
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
                        <Form.Check
                          type="switch"
                          id={`disp-${item.id}`}
                          label="Disponível"
                          checked={item.disponivel !== false}
                          onChange={() => alternarDisponivel(item)}
                        />
                        {podeEditar && (
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => abrirEdicao(item)}
                            >
                              Editar
                            </Button>
                           {podeExcluir && (
                             <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => excluir(item)}
                             >
                               Excluir
                             </Button>
                           )}
                          </div>
                        )}
                      </div>
                    }
                  />
                </Col>
              ))}
            </Row>
          </section>
        ))
      )}

      <Modal
        show={mostrarForm}
        onHide={() => !salvando && setMostrarForm(false)}
        centered
      >
        <Form onSubmit={salvar}>
          <Modal.Header closeButton>
            <Modal.Title className="h5">
              {editandoId ? "Editar item" : "Novo item"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {erro && <Alert variant="danger">{erro}</Alert>}

            <Form.Group className="mb-3" controlId="foto">
              <Form.Label>Foto do prato</Form.Label>
              {form.imagemUrl && (
                <div className="mb-2">
                  <img
                    src={form.imagemUrl}
                    alt="Pré-visualização"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: "cover",
                      borderRadius: "0.75rem",
                    }}
                  />
                </div>
              )}
              <Form.Control
                type="file"
                accept="image/*"
                onChange={escolherFoto}
                disabled={processandoFoto}
              />
              {processandoFoto && <Form.Text>Processando a foto...</Form.Text>}
              {form.imagemUrl && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 mt-1"
                  onClick={() => atualizar("imagemUrl", "")}
                >
                  Remover foto
                </Button>
              )}
            </Form.Group>

            <Form.Group className="mb-3" controlId="nome">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                value={form.nome}
                onChange={(e) => atualizar("nome", e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="descricao">
              <Form.Label>Descrição (o que compõe o prato)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.descricao}
                onChange={(e) => atualizar("descricao", e.target.value)}
              />
            </Form.Group>

            <Row>
              <Col xs={6}>
                <Form.Group className="mb-3" controlId="preco">
                  <Form.Label>Preço (R$)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.preco}
                    onChange={(e) => atualizar("preco", e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group className="mb-3" controlId="categoria">
                  <Form.Label>Categoria</Form.Label>
                  <Form.Control
                    type="text"
                    list="lista-categorias"
                    value={form.categoria}
                    onChange={(e) => atualizar("categoria", e.target.value)}
                    required
                  />
                  <datalist id="lista-categorias">
                    {sugestoes.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="oferta">
              <Form.Label>Este item está em oferta?</Form.Label>
              <Form.Select
                value={form.oferta}
                onChange={(e) => atualizar("oferta", e.target.value)}
              >
                <option value="nenhuma">Não, preço normal</option>
                <option value="promocao">Promoção</option>
                <option value="combo_dia">Combo do dia</option>
                <option value="combo_semana">Combo da semana</option>
              </Form.Select>
              {(form.oferta === "combo_dia" || form.oferta === "combo_semana") && (
                <Form.Text>
                  Para combos, informe no campo Preço o valor total do combo.
                </Form.Text>
              )}
            </Form.Group>

            {form.oferta === "promocao" && (
              <Form.Group className="mb-3" controlId="precoPromocional">
                <Form.Label>Preço promocional (R$)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precoPromocional}
                  onChange={(e) => atualizar("precoPromocional", e.target.value)}
                  required
                />
              </Form.Group>
            )}

            <Form.Check
              type="switch"
              id="form-disponivel"
              label="Disponível para pedidos"
              checked={form.disponivel}
              onChange={(e) => atualizar("disponivel", e.target.checked)}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setMostrarForm(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando || processandoFoto}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}