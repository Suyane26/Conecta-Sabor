import { formatarPreco } from "../utils/formatar";

export default function ItemCardapio({ item, onAdicionar, acoes }) {
  const promocao = item.oferta === "promocao" && item.precoPromocional != null;
  const desconto = promocao
    ? Math.round((1 - item.precoPromocional / item.preco) * 100)
    : 0;
  const precoAtual = promocao ? item.precoPromocional : item.preco;
  const indisponivel = item.disponivel === false;
  const combo = item.oferta === "combo_dia" || item.oferta === "combo_semana";
  const temSelo = promocao || combo || indisponivel;

  return (
    <div className={`cs-produto${indisponivel ? " indisponivel" : ""}`}>
      {item.imagemUrl ? (
        <img src={item.imagemUrl} alt={item.nome} />
      ) : (
        <div className="cs-produto-sem-foto">Sem foto</div>
      )}

      <div className="cs-produto-corpo">
        <div className="cs-produto-info">
          {temSelo && (
            <div className="d-flex flex-wrap gap-1 mb-1">
              {promocao && <span className="cs-selo">-{desconto}%</span>}
              {item.oferta === "combo_dia" && (
                <span className="cs-selo cs-selo-combo">Combo do dia</span>
              )}
              {item.oferta === "combo_semana" && (
                <span className="cs-selo cs-selo-combo">Combo da semana</span>
              )}
              {indisponivel && (
                <span className="cs-selo cs-selo-off">Indisponível</span>
              )}
            </div>
          )}

          <h3 className="cs-produto-nome h6">{item.nome}</h3>
          {item.descricao && <p className="cs-produto-desc">{item.descricao}</p>}

          <div>
            <span className="cs-preco">{formatarPreco(precoAtual)}</span>
            {promocao && (
              <span className="cs-preco-antigo">{formatarPreco(item.preco)}</span>
            )}
          </div>
        </div>

        {acoes}
      </div>

      {onAdicionar && !indisponivel && (
        <button
          type="button"
          className="cs-botao-add"
          aria-label={`Adicionar ${item.nome}`}
          onClick={() => onAdicionar(item)}
        >
          +
        </button>
      )}
    </div>
  );
}