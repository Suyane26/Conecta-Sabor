import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(false);

  async function buscarDados(uid) {
    const snap = await getDoc(doc(db, "usuarios", uid));
    setDados(snap.exists() ? snap.data() : null);
  }

  async function cadastrar(nome, email, senha) {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(credencial.user, { displayName: nome });
  }

  function entrar(email, senha) {
    return signInWithEmailAndPassword(auth, email, senha);
  }

  function entrarComGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider());
  }

  function sair() {
    return signOut(auth);
  }

  async function recarregar() {
    if (auth.currentUser) await buscarDados(auth.currentUser.uid);
  }

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      if (user) {
        setCarregandoDados(true);
        try {
          await buscarDados(user.uid);
        } catch (erro) {
          console.error("Erro ao buscar dados do usuário:", erro);
          setDados(null);
        } finally {
          setCarregandoDados(false);
        }
      } else {
        setDados(null);
      }
      setCarregando(false);
    });
    return cancelar;
  }, []);

  const valor = {
    usuario,
    dados,
    perfil: dados?.perfil ?? null,
    carregandoDados,
    cadastrar,
    entrar,
    entrarComGoogle,
    sair,
    recarregar,
  };

  return (
    <AuthContext.Provider value={valor}>
      {!carregando && children}
    </AuthContext.Provider>
  );
}