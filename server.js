const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/ministerio_db';
let db;

async function initDB() {
  try {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db('ministerio_db');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

app.get('/api/data', async (req, res) => {
  try {
    const hermanos = await db.collection('hermanos').find({}).toArray();
    const familias = await db.collection('familias').find({}).toArray();
    const grupos = await db.collection('grupos').find({}).toArray();
    
    res.json({
      hermanos: hermanos,
      familias: familias,
      grupos: grupos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/data', async (req, res) => {
  const { hermanos, familias, grupos } = req.body;
  
  try {
    await db.collection('hermanos').deleteMany({});
    await db.collection('familias').deleteMany({});
    await db.collection('grupos').deleteMany({});
    
    if (hermanos && hermanos.length > 0) {
      await db.collection('hermanos').insertMany(hermanos);
    }
    
    if (familias && familias.length > 0) {
      await db.collection('familias').insertMany(familias);
    }
    
    if (grupos && grupos.length > 0) {
      await db.collection('grupos').insertMany(grupos);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

initDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});