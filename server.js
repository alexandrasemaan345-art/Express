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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/', (req,res) =>{
    res.send('After School API is running');
});

