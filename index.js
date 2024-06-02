const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const cors = require('cors')
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
    ]
}))
app.use(express.json())


app.get('/', (req, res) => {
    res.send('bangal tour is runnig')
})




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xes5bsh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const usersCollection = client.db("bangalTourDb").collection("users");

        // users api
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })
        app.post('/users', async (req, res) => {
            const user = req.body
            // check user isexists in dataabse
            const query = { email: user.email }
            const existsUser = await usersCollection.findOne(query)
            if (existsUser) {
                return res.send({ insertedId: null })
            }
            else {
                const result = await usersCollection.insertOne(user);
                res.send(result)
            }
        })




        // Send a ping to confirm a successful connection

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.listen(port, () => {
    console.log(`bangal tour is running port: ${port}`);
})