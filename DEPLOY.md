# Guia de Implantação e Deploy — Conecta Sabor

Este guia descreve os passos necessários para configurar, executar localmente, testar em dispositivos móveis e publicar (deploy) o sistema **Conecta Sabor** em produção.

---

## 1. Arquitetura e Stack

- **Frontend:** React + Vite + React Router + Bootstrap 5
- **Backend / BaaS:** Firebase Authentication + Cloud Firestore (`desenvolvimento-web-4d6e8`)
- **Serviços Externos:** Consulta pública de CEP via API ViaCEP (`https://viacep.com.br`)

---

## 2. Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** (gerenciador de pacotes)
- **Git**
- Conta no **Firebase Console** com Authentication (E-mail/Senha) e Cloud Firestore ativados

---

## 3. Instalação e Configuração Local

1. Clone o repositório e entre na pasta do projeto:
   ```bash
   git clone [https://github.com/Suyane26/Conecta-Sabor.git](https://github.com/Suyane26/Conecta-Sabor.git)
   cd Conecta-Sabor