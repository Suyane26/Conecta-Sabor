import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { STATUS_ATIVOS, milis } from "../utils/pedidos";

export function useAgora(intervaloMs = 30000) {
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);

  return agora;
}

export function usePedidosAtivos(restauranteId) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const consulta = query(
      collection(db, "pedidos"),
      where("restauranteId", "==", restauranteId),
      where("status", "in", STATUS_ATIVOS)
    );

    const cancelar = onSnapshot(
      consulta,
      (snap) => {
        const lista = snap.docs.map((d) => ({
          id: d.id,
          ...d.data({ serverTimestamps: "estimate" }),
        }));
        lista.sort((a, b) => milis(a.criadoEm) - milis(b.criadoEm));
        setPedidos(lista);
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao carregar os pedidos:", erro);
        setCarregando(false);
      }
    );

    return cancelar;
  }, [restauranteId]);

  return { pedidos, carregando };
}