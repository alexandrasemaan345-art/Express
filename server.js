require('dotenv').config();
const express = require('express');
const cors = require ('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable Croos-Origin Resource Sharing for the frontend
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

// MongoDB connection (db is set once the connection succeeds)
const client = new MongoClient(process.env.MONGO_URI);
let db;

// Root route
app.get('/', (req, res) => {
    res.send('After School API is running');
});

// GET /lesson: return all lessons as JSON 
app.get('/lessons', async (req, res) => {
    try {
        const lessons = await db.collection('lesson').find({}).toArray();
        res.json(lessons);
    }  catch (err) {
        console.error(err);
        res.status(500).json({error: 'Could not fetch lessons'});
    }

});

// Challenge: Search Route
app.get('/search', async (req, res) => {
    try{
        const searchTerm = req.query.q; // It will send the search term as ?q=math

        if(!searchTerm) {
            return res.json([]);
        }

        const allLessons = await db.collection('lesson').find({}).toArray();

        const results = allLessons.filter(lesson => {
            const query = searchTerm.toLowerCase();
            return (
                (lesson.subject && lesson.subject.toLowerCase().includes(query)) ||
                (lesson.location && lesson.location.toLowerCase().includes(query)) ||
                (lesson.price && lesson.price.toString().includes(query)) ||
                (lesson.spaces && lesson.spaces.toString().includes(query))
            );
        });

        res.json(results);
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ error: 'Could not perform search'});
    }
});

// POST /orders: save a new order
app.post('/orders', async (req, res) =>{
    try {
      const { name, phone, lessonIds, spaces, bookingDate } = req.body; 
      
      const result = await db.collection('order').insertOne ({ 
        name: name,
        phone: phone,
        lessonIds: lessonIds,
        spaces: spaces,
        bookingDate: bookingDate
    }); 
      res.json({ message: 'Order saved', id: result.insertedId});
    } catch (err) {
        console.error("Error saving order:", err);
        res.status(500).json({ error: 'Could not save order'});
    }
    });

    
// PUT /lessons/:id: update any attribute of a lesson
app.put('/lesson/:id', async (req, res) => {
    try{
      const result = await db.collection('lesson').updateOne(
        {_id: new ObjectId(req.params.id)},
        {$set: req.body}  
     );
      res.json({ message: 'Lesson updated', modified: result.modifiedCount});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Could not update lesson'});
    }
    });

// Challenge part: Enrolement Route
app.get('/enrolment/:lessonid', async (req, res) => {
    try{
        const lessonId = req.params.lessonid;
        // Find all orders that contain this lesson ID
        const orders = await db.collection('order').find({ lessonIds: lessonId }).toArray();

        let totalEnrolled = 0;
        // Loop through the orders and add up the spaces
        orders.forEach(order => {
            totalEnrolled += order.spaces;
        });

        res.json({
            lessonId: lessonId,
            enrolmentNumber: totalEnrolled
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not calculate enrolment'});
    }
});

// CHALLENGE: Get all teachers (for dropdown)
app.get('/teachers', async (req,res) => {
    try {
        const teachers = await db.collection('teachers').find({}).toArray();
        res.json(teachers);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Could not fetch teachers'});
    }
});

// CHALLENGE: Get all lessons taught by a specific teacher
app.get('/teachers/:id/lessons', async (req, res) => {
    try {
        const teacherId = req.params.id;
        const teacher = await db.collection('teachers').findOne({ _id: new ObjectId(teacherId) });
        
        if (!teacher || !teacher.lessonIds || teacher.lessonIds.length === 0) {
            return res.json([]);
        }

        const lessonObjectIds = teacher.lessonIds
        .filter(id => id && typeof id === 'string' && id.trim().length === 24)
        .map(id => new ObjectId(id.trim()));

        const lessons = await db.collection('lesson').find({
            _id: { $in: lessonObjectIds }
        }).toArray();

        res.json(lessons);
    } catch (err) {
        console.error("Teacher Route Error:", err);
        res.status(500).json({ error: 'Cound not fetch teacher lessons'});
    }
});

// Connect to MongoDB first, then start listening   
async function start() {
    await client.connect();
    db = client.db('afterschool');
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log (`Server running on port ${PORT}`));
}
start();


