const express = require('express');
const cors = require ('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

//Logger middleware: prints every request to the console
app.use((req,res,next) => {
    console.log(`${new Date().toISOString()} -${req.method} ${req.url}`);
    next();
});

// Static file middleware: serves lesson images from the /images folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// If the image wasn't found above, this runs and returns an error message 
app.use('/images', (req, res) => {
    res.status(404).json({error:'Image not found'});
});

app.get('/lessons', async (req, res) => {
const lessons = await db.collection('lesson').find({}).toArray();
res.json(lessons);
});

app.post('/orders', async (req, res) =>{
    const { name, phone, lessonIDs, spaces } = req.body;
    const result = await db.collection('order').insertOne ({ name, phone, lessonIDs, spaces});
    res.json({ message: 'Order saved', id: result.insertedId});
});

app.put('/lesson/:id', async (req, res) =>{
    const result = await db.collection('lesson').updateOne(
    {_id: new ObjectId(req.params.id)},
    {$set: req.body}
    );
    res.json({ message: 'Lesson updated', modified: result.modifiedCount});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/', (req,res) =>{
    res.send('After School API is running');
});

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const client = new MongoClient('process.env.MONGO-URI');
let Db;

async function start() {
    await client.connect();
    db = client.db('afterschool');
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log ('Server running on port ${PORT}'));
}
start();

