import { useEffect, useState } from "react";
import { Modal, Form, Button, Alert, Row, Col, Spinner } from "react-bootstrap";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { formatarPreco } from "../utils/formatar";
import { precoEfetivo } from "../utils/pedidos";

function FormularioPedido({ restauranteId, mesaFixa, onHide, onCriado }) {
  const { usuario } = useAuth();
  const [mesa] = useState(mesaFixa);

  const [cardapio, setCardapio] = useState([]);
  const [tipo, setTipo] = useState(mesa ? "mesa" : "retirada");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [complemento, setComplemento] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [qtds, setQtds] = useState({});
  const [obs, setObs] = useState({});
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const consulta = query(
      collection(db, "cardapio"),
      where("restauranteId", "==", restauranteId),
      where("disponivel", "==", true)
    );

    return onSnapshot(
      consulta,
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        lista.sort(
          (a, b) =>
            a.categoria.localeCompare(b.categoria, "pt-BR") ||
            a.nome.localeCompare(b.nome, "pt-BR")
        );
        setCardapio(lista);
      },
      (e) => console.error("Erro ao carregar o cardápio:", e)
    );
  }, [restauranteId]);

  async function buscarCepAutomatico(valorCep) {
    const digitos = valorCep.replace(/\D/g, "").slice(0, 8);
    const formatado =
      digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
    setCep(formatado);
    setAvisoCep("");

    if (digitos.length !== 8) return;

    setBuscandoCep(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const dadosCep = await resp.json();
      if (dadosCep.erro) {
        setAvisoCep("CEP não encontrado. Preencha o endereço manualmente.");
        return;
      }
      if (dadosCep.logradouro) setRua(dadosCep.logradouro);
      if (dadosCep.bairro) setBairro(dadosCep.bairro);
      if (dadosCep.localidade) {
        setCidade(dadosCep.uf ? `${dadosCep.localidade}/${dadosCep.uf}` : dadosCep.localidade);
      }
    } catch {
      setAvisoCep("Não foi possível consultar o CEP agora.");
    } finally {
      setBuscandoCep(false);
    }
  }

  function ajustar(id, delta) {
    setQtds((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) + delta) }));
  }

  const selecionados = cardapio.filter((i) => (qtds[i.id] || 0) > 0);
  const total = selecionados.reduce(
    (soma, i) => soma + precoEfetivo(i) * qtds[i.id],
    0
  );

  async function salvar(e) {
    e.preventDefault();
    setErro("");

    if (selecionados.length === 0) {
      return setErro("Adicione pelo menos um item ao pedido.");
    }
    if (tipo !== "mesa" && !clienteNome.trim()) {
      return setErro("Informe o nome do cliente.");
    }

    let enderecoCompleto = null;
    if (tipo === "entrega") {
      if (!rua.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !clienteTelefone.trim()) {
        return setErro("Informe telefone, rua, número, bairro e cidade para a entrega.");
      }
      enderecoCompleto = `${rua.trim()}, ${numero.trim()} - ${bairro.trim()}, ${cidade.trim()}`;
      if (complemento.trim()) enderecoCompleto += ` (${complemento.trim()})`;
      if (cep.trim()) enderecoCompleto += ` - CEP: ${cep.trim()}`;
    }

    const itens = selecionados.map((i) => ({
      itemId: i.id,
      nome: i.nome,
      quantidade: qtds[i.id],
      preco: precoEfetivo(i),
      observacao: (obs[i.id] || "").trim(),
    }));

    const pedido = {
      restauranteId,
      tipo,
      itens,
      total: Math.round(total * 100) / 100,
      observacoes: observacoes.trim(),
      status: "recebido",
      origem: tipo === "mesa" ? "salao" : "balcao",
      criadoPor: usuario.uid,
      criadoEm: serverTimestamp(),
      statusAtualizadoEm: serverTimestamp(),
      mesaId: null,
      mesaNumero: null,
      contaAberta: false,
      clienteNome: null,
      clienteTelefone: null,
      endereco: null,
      entregadorId: null,
      entregadorNome: null,
      notaFiscal: null,
    };

    if (tipo === "mesa") {
      pedido.mesaId = mesa.id;
      pedido.mesaNumero = mesa.numero;
      pedido.contaAberta = true;
    } else {
      pedido.clienteNome = clienteNome.trim();
      pedido.clienteTelefone = clienteTelefone.trim() || null;
      if (tipo === "entrega") pedido.endereco = enderecoCompleto;
    }

    setSalvando(true);
    try {
      const lote = writeBatch(db);
      lote.set(doc(collection(db, "pedidos")), pedido);
      if (tipo === "mesa") {
        lote.update(doc(db, "mesas", mesa.id), { status: "ocupada" });
      }
      await lote.commit();
      if (onCriado) onCriado();
      onHide();
    } catch (err) {
      console.error(err);
      setErro("Não foi possível registrar o pedido. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Form onSubmit={salvar}>
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          Novo pedido{mesa ? ` · Mesa ${mesa.numero}` : ""}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {erro && <Alert variant="danger">{erro}</Alert>}

        {!mesa && (
          <>
            <Form.Group className="mb-3" controlId="tipo">
              <Form.Label>Tipo do pedido</Form.Label>
              <Form.Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="retirada">Retirada no balcão</option>
                <option value="entrega">Entrega</option>
              </Form.Select>
            </Form.Group>

            <Row>
              <Col xs={12} md={tipo === "entrega" ? 6 : 12}>
                <Form.Group className="mb-3" controlId="clienteNome">
                  <Form.Label>Nome do cliente</Form.Label>
                  <Form.Control
                    type="text"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3" controlId="clienteTelefone">
                  <Form.Label>
                    Telefone{tipo === "retirada" ? " (opcional)" : ""}
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            {tipo === "entrega" && (
              <div className="border rounded-3 p-3 mb-3 bg-light">
                <Form.Group className="mb-3" controlId="cepNovoPedido">
                  <Form.Label>CEP</Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="text"
                      placeholder="Digite 8 números para buscar a rua"
                      value={cep}
                      onChange={(e) => buscarCepAutomatico(e.target.value)}
                      maxLength={9}
                    />
                    {buscandoCep && <Spinner animation="border" size="sm" />}
                  </div>
                  {avisoCep && <Form.Text className="text-warning-emphasis">{avisoCep}</Form.Text>}
                </Form.Group>

                <Row>
                  <Col xs={12} md={8}>
                    <Form.Group className="mb-3" controlId="ruaNovoPedido">
                      <Form.Label>Rua</Form.Label>
                      <Form.Control
                        type="text"
                        value={rua}
                        onChange={(e) => setRua(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Group className="mb-3" controlId="numeroNovoPedido">
                      <Form.Label>Número</Form.Label>
                      <Form.Control
                        type="text"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3" controlId="bairroNovoPedido">
                      <Form.Label>Bairro</Form.Label>
                      <Form.Control
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3" controlId="cidadeNovoPedido">
                      <Form.Label>Cidade</Form.Label>
                      <Form.Control
                        type="text"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-0" controlId="complementoNovoPedido">
                  <Form.Label>Complemento (opcional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Apto, bloco, ponto de referência"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                  />
                </Form.Group>
              </div>
            )}
          </>
        )}

        <Form.Label>Itens</Form.Label>
        {cardapio.length === 0 && (
          <p className="text-muted small">
            Nenhum item disponível no cardápio no momento.
          </p>
        )}

        {cardapio.map((item) => {
          const qtd = qtds[item.id] || 0;
          return (
            <div key={item.id} className="border rounded-3 p-2 mb-2">
              <div className="d-flex justify-content-between align-items-center gap-2">
                <div className="flex-grow-1">
                  <div className="fw-semibold">{item.nome}</div>
                  <div className="small text-muted">
                    {item.categoria} · {formatarPreco(precoEfetivo(item))}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => ajustar(item.id, -1)}
                    disabled={qtd === 0}
                  >
                    -
                  </Button>
                  <span style={{ minWidth: 20, textAlign: "center" }}>{qtd}</span>
                  <Button size="sm" onClick={() => ajustar(item.id, 1)}>
                    +
                  </Button>
                </div>
              </div>

              {qtd > 0 && (
                <Form.Control
                  size="sm"
                  className="mt-2"
                  placeholder="Observação (ex.: sem cebola, acrescentar queijo)"
                  value={obs[item.id] || ""}
                  onChange={(e) =>
                    setObs((o) => ({ ...o, [item.id]: e.target.value }))
                  }
                />
              )}
            </div>
          );
        })}

        <Form.Group className="mt-3" controlId="observacoes">
          <Form.Label>Observações gerais do pedido</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer className="justify-content-between">
        <strong>Total: {formatarPreco(total)}</strong>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={onHide} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Enviando..." : "Enviar para a cozinha"}
          </Button>
        </div>
      </Modal.Footer>
    </Form>
  );
}

export default function NovoPedido({
  show,
  onHide,
  restauranteId,
  mesaFixa = null,
  onCriado,
}) {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <FormularioPedido
        restauranteId={restauranteId}
        mesaFixa={mesaFixa}
        onHide={onHide}
        onCriado={onCriado}
      />
    </Modal>
  );
}