import { useState, useEffect } from "react";
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { formatarPreco } from "../utils/formatar";
import { precoEfetivo } from "../utils/pedidos";

export default function CarrinhoCliente({
  show,
  onHide,
  restauranteId,
  carrinho,
  setCarrinho,
  onFinalizado,
}) {
  // Controle das telas: 1 = Carrinho, 2 = Tela de Retirada, 3 = Tela de Entrega
  const [passo, setPasso] = useState(1);
  
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [complemento, setComplemento] = useState("");
  const [observacoesGerais, setObservacoesGerais] = useState("");
  
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const total = carrinho.reduce((soma, i) => soma + precoEfetivo(i) * i.quantidade, 0);

  // Garante que toda vez que abrir, comece pelo passo 1
  useEffect(() => {
    if (show) setPasso(1);
  }, [show]);

  function fechar() {
    setErro("");
    onHide();
  }

  function ajustar(id, delta) {
    setCarrinho((prev) => {
      const atualizado = prev.map((item) =>
        item.id === id ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item
      );
      return atualizado.filter((item) => item.quantidade > 0);
    });
  }

  function atualizarObservacao(id, texto) {
    setCarrinho((prev) =>
      prev.map((item) => (item.id === id ? { ...item, observacao: texto } : item))
    );
  }

  async function finalizar(tipoPedido) {
    setErro("");
    if (!clienteNome.trim()) return setErro("Por favor, preencha o seu nome.");
    
    let enderecoCompleto = null;
    if (tipoPedido === "entrega") {
      if (!rua.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !clienteTelefone.trim()) {
        return setErro("Preencha todos os campos obrigatórios do endereço e telefone.");
      }
      enderecoCompleto = `${rua}, ${numero} - ${bairro}, ${cidade}`;
      if (complemento.trim()) enderecoCompleto += ` (${complemento})`;
      if (cep.trim()) enderecoCompleto += ` - CEP: ${cep}`;
    }

    const itens = carrinho.map((i) => ({
      itemId: i.id,
      nome: i.nome,
      quantidade: i.quantidade,
      preco: precoEfetivo(i),
      observacao: i.observacao ? i.observacao.trim() : "",
    }));

    const pedido = {
      restauranteId,
      tipo: tipoPedido,
      itens,
      total: Math.round(total * 100) / 100,
      observacoes: observacoesGerais.trim(),
      status: "recebido",
      origem: "app_cliente",
      criadoPor: "cliente",
      criadoEm: serverTimestamp(),
      statusAtualizadoEm: serverTimestamp(),
      mesaId: null,
      mesaNumero: null,
      contaAberta: false,
      clienteNome: clienteNome.trim(),
      clienteTelefone: clienteTelefone.trim() || null,
      endereco: enderecoCompleto,
      entregadorId: null,
      entregadorNome: null,
      notaFiscal: null,
    };

    setSalvando(true);
    try {
      const lote = writeBatch(db);
      lote.set(doc(collection(db, "pedidos")), pedido);
      await lote.commit();
      
      // Limpa tudo após o sucesso
      setCarrinho([]);
      setPasso(1);
      setObservacoesGerais("");
      onFinalizado();
      fechar();
    } catch (err) {
      setErro("Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal show={show} onHide={fechar} fullscreen className="cs-modal-app">
      
      {/* ---------------- PASSO 1: CARRINHO E ITENS ---------------- */}
      {passo === 1 && (
        <div className="cs-tela-app">
          <div className="cs-header-app">
            <span style={{ width: "24px" }}></span>
            <span className="h6 mb-0">Carrinho</span>
            <button type="button" className="btn-close" onClick={fechar} aria-label="Fechar"></button>
          </div>
          
          <div className="cs-body-app pb-carrinho">
            {erro && <Alert variant="danger">{erro}</Alert>}
            
            {carrinho.length === 0 ? (
              <div className="text-center mt-5 text-muted">
                <p>Seu carrinho está vazio.</p>
                <Button variant="outline-primary" onClick={fechar}>Voltar ao cardápio</Button>
              </div>
            ) : (
              <>
                <div className="cs-box">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-semibold text-muted">Itens do pedido</span>
                    <Button variant="link" className="p-0 text-decoration-none" size="sm" onClick={fechar}>
                      + Adicionar mais itens
                    </Button>
                  </div>
                  
                  {carrinho.map((item) => (
                    <div key={item.id} className="mb-3 border-bottom pb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="fw-semibold">{item.nome}</div>
                          <div className="small text-muted">{formatarPreco(precoEfetivo(item))}</div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Button size="sm" variant="outline-secondary" onClick={() => ajustar(item.id, -1)}>-</Button>
                          <span style={{ minWidth: "20px", textAlign: "center", fontWeight: "600" }}>{item.quantidade}</span>
                          <Button size="sm" variant="outline-secondary" onClick={() => ajustar(item.id, 1)}>+</Button>
                        </div>
                      </div>
                      <Form.Control
                        size="sm"
                        placeholder="Observação (ex.: sem cebola, ponto da carne)"
                        value={item.observacao || ""}
                        onChange={(e) => atualizarObservacao(item.id, e.target.value)}
                      />
                    </div>
                  ))}
                  <div className="text-center mt-2">
                    <Button variant="link" className="text-muted text-decoration-none" size="sm" onClick={() => setCarrinho([])}>
                      Limpar carrinho
                    </Button>
                  </div>
                </div>

                <div className="cs-box">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Subtotal:</span>
                    <span>{formatarPreco(total)}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold fs-5">
                    <span>Total:</span>
                    <span>{formatarPreco(total)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {carrinho.length > 0 && (
            <div className="cs-footer-app shadow-lg">
              <div className="mb-2 fw-semibold text-center small">Como quer seu pedido?</div>
              <div className="d-flex gap-2">
                <Button variant="outline-primary" className="w-100 fw-bold" onClick={() => setPasso(2)}>
                  🚶 Retirada
                </Button>
                <Button variant="primary" className="w-100 fw-bold" onClick={() => setPasso(3)}>
                  🛵 Entrega
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- PASSO 2: DADOS PARA RETIRADA ---------------- */}
      {passo === 2 && (
        <Form className="cs-tela-app" onSubmit={(e) => { e.preventDefault(); finalizar("retirada"); }}>
          <div className="cs-header-app">
            <Button variant="link" className="p-0 text-dark fs-4 text-decoration-none" onClick={() => setPasso(1)}>
              &lsaquo;
            </Button>
            <span className="h6 mb-0">Retirada</span>
            <span style={{ width: "24px" }}></span>
          </div>
          
          <div className="cs-body-app pb-footer">
            {erro && <Alert variant="danger">{erro}</Alert>}
            
            <div className="cs-box">
              <h6 className="mb-3">Identificação</h6>
              <Form.Group className="mb-3" controlId="nomeRetirada">
                <Form.Control type="text" placeholder="Seu nome" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="telRetirada">
                <Form.Control type="tel" placeholder="Telefone" value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} />
              </Form.Group>
              
              <h6 className="mt-4 mb-2 d-flex align-items-center gap-2">
                <span style={{ color: "var(--bs-primary)" }}>🚶</span> Local de retirada
              </h6>
              <p className="small text-muted mb-0">
                O pedido será preparado e você poderá retirar diretamente no balcão do restaurante.
              </p>
            </div>
            
            <div className="cs-box mt-3">
              <Form.Group controlId="obsRetirada">
                <Form.Label className="fw-semibold">Observações gerais (opcional)</Form.Label>
                <Form.Control as="textarea" rows={2} placeholder="Ex.: Levar troco para R$ 50,00" value={observacoesGerais} onChange={(e) => setObservacoesGerais(e.target.value)} />
              </Form.Group>
            </div>
          </div>
          
          <div className="cs-footer-app shadow-lg">
            <Button type="submit" className="w-100 fw-bold py-2" disabled={salvando}>
              {salvando ? "Salvando..." : "Confirmar e Enviar Pedido"}
            </Button>
          </div>
        </Form>
      )}

      {/* ---------------- PASSO 3: DADOS PARA ENTREGA ---------------- */}
      {passo === 3 && (
        <Form className="cs-tela-app" onSubmit={(e) => { e.preventDefault(); finalizar("entrega"); }}>
          <div className="cs-header-app">
            <Button variant="link" className="p-0 text-dark fs-4 text-decoration-none" onClick={() => setPasso(1)}>
              &lsaquo;
            </Button>
            <span className="h6 mb-0">Endereço de Entrega</span>
            <span style={{ width: "24px" }}></span>
          </div>
          
          <div className="cs-body-app pb-footer">
            {erro && <Alert variant="danger">{erro}</Alert>}
            
            <div className="cs-box">
              <h6 className="mb-3">Identificação</h6>
              <Form.Group className="mb-3" controlId="nomeEntrega">
                <Form.Control type="text" placeholder="Seu nome" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="telEntrega">
                <Form.Control type="tel" placeholder="Telefone (WhatsApp)" value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} required />
              </Form.Group>
            </div>

            <div className="cs-box">
              <h6 className="mb-3">Endereço</h6>
              <Form.Group className="mb-3" controlId="bairro">
                <Form.Control type="text" placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="cep">
                <Form.Control type="text" placeholder="CEP (Opcional)" value={cep} onChange={(e) => setCep(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="rua">
                <Form.Control type="text" placeholder="Rua" value={rua} onChange={(e) => setRua(e.target.value)} required />
              </Form.Group>
              <Row>
                <Col xs={4}>
                  <Form.Group className="mb-3" controlId="numero">
                    <Form.Control type="text" placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} required />
                  </Form.Group>
                </Col>
                <Col xs={8}>
                  <Form.Group className="mb-3" controlId="cidade">
                    <Form.Control type="text" placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} required />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-0" controlId="complemento">
                <Form.Control as="textarea" rows={2} placeholder="Complemento (Apto, bloco, ponto de referência)" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
              </Form.Group>
            </div>

            <div className="cs-box mt-3">
              <Form.Group controlId="obsEntrega">
                <Form.Label className="fw-semibold">Observações gerais (opcional)</Form.Label>
                <Form.Control as="textarea" rows={2} placeholder="Ex.: Troco para R$ 100,00" value={observacoesGerais} onChange={(e) => setObservacoesGerais(e.target.value)} />
              </Form.Group>
            </div>
          </div>
          
          <div className="cs-footer-app shadow-lg">
            <Button type="submit" className="w-100 fw-bold py-2" disabled={salvando}>
              {salvando ? "Salvando..." : "Confirmar e Enviar Pedido"}
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
}