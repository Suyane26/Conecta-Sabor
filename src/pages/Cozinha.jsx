import { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Button } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import QuadroPedidos from "../components/QuadroPedidos";
import { prepararAlerta, tocarAlerta } from "../utils/alerta";

const COLUNAS = [
  { status: "recebido", titulo: "Recebido" },
  { status: "em_preparo", titulo: "Em preparo" },
  { status: "pronto", titulo: "Pronto" },
];

export default function Cozinha() {
  const { dados, sair } = useAuth();
  const [som, setSom] = useState(false);

  function alternarSom() {
    if (!som) {
      prepararAlerta();
      tocarAlerta();
    }
    setSom(!som);
  }

  return (
    <Container fluid className="py-4 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <Link to="/painel" className="small">
            &larr; Voltar ao painel
          </Link>
          <h2 className="mb-0">Cozinha</h2>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Button
            variant={som ? "success" : "outline-secondary"}
            onClick={alternarSom}
          >
            {som ? "Som ligado" : "Ativar som"}
          </Button>
          <Button as={Link} to="/painel/cardapio" variant="outline-primary">
            Cardápio
          </Button>
          <Button variant="outline-danger" onClick={sair}>
            Sair
          </Button>
        </div>
      </div>

      <QuadroPedidos
        restauranteId={dados.restauranteId}
        perfil={dados.perfil}
        colunas={COLUNAS}
        somAtivo={som}
      />
    </Container>
  );
}