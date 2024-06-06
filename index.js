const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken')
const cors = require('cors')
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://assignment-12-a77e8.web.app",

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
        const wishListCollection = client.db("bangalTourDb").collection("wishList");
        const tourGuideCollection = client.db("bangalTourDb").collection("tourGuide");
        const packagesCollection = client.db("bangalTourDb").collection("packages");
        const packageBookingCollection = client.db("bangalTourDb").collection("packageBooking");

        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

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


        // packages api
        app.get('/packages', async (req, res) => {
            const result = await packagesCollection.find().toArray();
            res.send(result)
        })
        app.get('/packages/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await packagesCollection.findOne(query);
            res.send(result)
        })
        app.post('/packages', async (req, res) => {
            const package = req.body;
            const result = await packagesCollection.insertOne(package);
            res.send(result)
        })

        app.delete('/packages/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await packagesCollection.deleteOne(query)
            res.send(result)
        })

        // guide api
        app.get('/tourGuide', async (req, res) => {
            const result = await tourGuideCollection.find().toArray()
            res.send(result)
        })
        app.get('/tourGuide/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await tourGuideCollection.findOne(query)
            res.send(result)
        })

        // booking api
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = {

                packageName: booking.packageName,
                userEmail: booking.userEmail
            }
            const alreadyBooked = await packageBookingCollection.findOne(query)
            if (alreadyBooked) {
                return res
                    .status(400)
                    .send('You already Purchase')
            }
            const result = await packageBookingCollection.insertOne(booking);
            res.send(result)
        })
        // wishlist
        app.post('/wishList', async (req, res) => {
            const package = req.body;
            const result = await wishListCollection.insertOne(package);
            res.send(result)
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