import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
  deleteUser,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
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
  const ultimaBusca = useRef(0);

  async function buscarDados(uid) {
    const numero = ++ultimaBusca.current;
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (numero === ultimaBusca.current) {
      setDados(snap.exists() ? snap.data() : null);
    }
  }

  async function recarregar() {
    if (auth.currentUser) await buscarDados(auth.currentUser.uid);
  }

  async function desfazerConta(user) {
    try {
      await deleteUser(user);
    } catch {
      await signOut(auth);
    }
  }

  async function verificarCadastro(user) {
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (!snap.exists()) {
      await desfazerConta(user);
      const erro = new Error("Cadastro não encontrado");
      erro.code = "app/sem-cadastro";
      throw erro;
    }
  }

  async function definirPersistencia(lembrar) {
    await setPersistence(
      auth,
      lembrar ? browserLocalPersistence : browserSessionPersistence
    );
  }

  async function entrar(email, senha, lembrar = true) {
    await definirPersistencia(lembrar);
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    await verificarCadastro(cred.user);
  }

  async function entrarComGoogle(lembrar = true) {
    await definirPersistencia(lembrar);
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    await verificarCadastro(cred.user);
  }

  function redefinirSenha(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function cadastrarUsuario({ nome, email, senha, perfil, restauranteId }) {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    try {
      await updateProfile(cred.user, { displayName: nome });
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nome,
        email,
        perfil,
        restauranteId,
        status: "ativo",
        criadoEm: serverTimestamp(),
      });
      await buscarDados(cred.user.uid);
    } catch (erro) {
      await desfazerConta(cred.user);
      throw erro;
    }
  }

  async function cadastrarRestaurante({ nomeRestaurante, cnpj, nomeDono, email, senha }) {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    try {
      const repetido = await getDocs(
        query(collection(db, "restaurantes"), where("cnpj", "==", cnpj), limit(1))
      );
      if (!repetido.empty) {
        const erro = new Error("CNPJ já cadastrado");
        erro.code = "app/cnpj-ja-cadastrado";
        throw erro;
      }

      await updateProfile(cred.user, { displayName: nomeDono });

      const refRestaurante = doc(collection(db, "restaurantes"));
      const lote = writeBatch(db);
      lote.set(refRestaurante, {
        nome: nomeRestaurante,
        cnpj,
        donoId: cred.user.uid,
        donoNome: nomeDono,
        criadoEm: serverTimestamp(),
      });
      lote.set(doc(db, "usuarios", cred.user.uid), {
        nome: nomeDono,
        email,
        perfil: "dono",
        restauranteId: refRestaurante.id,
        status: "ativo",
        criadoEm: serverTimestamp(),
      });
      await lote.commit();
      await buscarDados(cred.user.uid);
    } catch (erro) {
      await desfazerConta(cred.user);
      throw erro;
    }
  }

  async function cadastrarComGoogle({ perfil, restauranteId }) {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    const contaNova = getAdditionalUserInfo(cred)?.isNewUser;
    try {
      const ref = doc(db, "usuarios", cred.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          nome: cred.user.displayName || "",
          email: cred.user.email,
          perfil,
          restauranteId,
          status: "ativo",
          criadoEm: serverTimestamp(),
        });
      }
      await buscarDados(cred.user.uid);
    } catch (erro) {
      if (contaNova) await desfazerConta(cred.user);
      throw erro;
    }
  }

  function sair() {
    return signOut(auth);
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
        ultimaBusca.current++;
        setDados(null);
        setCarregandoDados(false);
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
    entrar,
    entrarComGoogle,
    redefinirSenha,
    cadastrarUsuario,
    cadastrarRestaurante,
    cadastrarComGoogle,
    recarregar,
    sair,
  };

  return (
    <AuthContext.Provider value={valor}>
      {!carregando && children}
    </AuthContext.Provider>
  );
}