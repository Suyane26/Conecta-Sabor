import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Rota de teste para ver se o backend está vivo
app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend a funcionar perfeitamente com MySQL!' });
});

// Exemplo de rota GET para buscar itens do cardápio do MySQL
app.get('/api/cardapio', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cardapio');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar cardápio no MySQL' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend a rodar na porta ${PORT}`);
});