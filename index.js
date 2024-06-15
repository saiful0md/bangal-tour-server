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
        const requestToAdminCollection = client.db("bangalTourDb").collection("requestToAdmin");
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

        // middleware jwt
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
                if (error) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next()
            })
        }
        // check isAdmin  or not middleware
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            const isAdmin = user?.role === 'admin'
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }


        //================= users api ================//
        // get all users
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })
        // todo
        // app.get("/users", verifyToken, async (req, res) => {
        //     const page = parseInt(req.query.page);
        //     const size = parseInt(req.query.size);
        //     const { name, role } = req.query;
        //     let query = {};
        //     if (name) {
        //         query.name = { $regex: name, $options: "i" };
        //     }
        //     if (role) {
        //         query.role = role;
        //     }
        //     const result = await usersCollection
        //         .find(query)
        //         .skip((page - 1) * size)
        //         .limit(size)
        //         .toArray();
        //     res.send(result);
        // });

        // getting users length for pagination
        // app.get("/users/count", async (req, res) => {
        //     const result = await usersCollection.estimatedDocumentCount();
        //     res.send({ count: result });
        // });


        // get user by email 
        app.get('/users/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })
        // user get by role base
        app.get('/users/guide/:role', async (req, res) => {
            const users = req.params.role
            const query = { role: users }
            const result = await usersCollection.find(query).toArray()
            res.send(result)
        })

        // check admin or not
        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            let admin = false;
            if (user) {
                admin = user?.role === "admin"
            }
            res.send({ admin })
        })
        //  check user is guide or not
        app.get('/users/guides/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            let guide = false;
            if (user) {
                guide = user?.role === "guide"
            }
            res.send({ guide })
        })
        //  check user is tourist or not
        // app.get('/users/tourist/:email', verifyToken, async (req, res) => {
        //     const email = req.params.email;
        //     if (email !== req.decoded.email) {
        //         return res.status(403).send({ message: 'forbidden access' })
        //     }
        //     const query = { email: email }
        //     const user = await usersCollection.findOne(query)
        //     console.log(user);
        //     let tourist = false;
        //     if (user) {
        //         tourist = user?.role === "tourist"
        //     }
        //     res.send({ tourist })
        // })



        // set user on signup
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

        // request-to-admin api
        app.put('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email }
            const alreadyRequested = await usersCollection.findOne(query)
            if (alreadyRequested) {
                if (user.roleStatus === 'requested') {
                    const result = await usersCollection.updateOne(query, { $set: { roleStatus: user?.roleStatus } })
                    return res.send(result)
                } else {

                    return res.send({ insertedId: null })
                }
            }
            const option = { upsert: true }
            const updateDoc = {
                $set: {
                    ...user,
                }
            }
            const result = await usersCollection.insertOne(query, updateDoc, option)
            res.send(result)

        })
        // admin change user role
        app.patch('/users/update/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const query = { email }
            const updateDoc = {
                $set: { ...user },
            }
            const result = await usersCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        // guide update own data
        app.patch('/users/guide-update/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const query = { email }
            const updateDoc = {
                $set: { ...user },
            }
            console.log(user);
            const result = await usersCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        // ================= packages api ===============//
        // get all packages
        app.get('/packages', async (req, res) => {
            const result = await packagesCollection.find().toArray();
            res.send(result)
        })
        //  get single package by id
        app.get('/packages/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await packagesCollection.findOne(query);
            res.send(result)
        })
        // add package by admin
        app.post('/packages', verifyToken, verifyAdmin, async (req, res) => {
            const package = req.body;
            const result = await packagesCollection.insertOne(package);
            res.send(result)
        })
        // delete package by admin
        app.delete('/packages/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await packagesCollection.deleteOne(query)
            res.send(result)
        })



        //================= booking api ===============//

        // get booked by user email
        app.get('/booking/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email }
            const result = await packageBookingCollection.find(query).toArray()
            res.send(result)
        })
        // get booking data guide base
        app.get('/booking/guideBase/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { "guide.email": email }
            const result = await packageBookingCollection.find(query).toArray()
            res.send(result)
        })

        // update booking status by guide
        app.put('/booking', verifyToken, async (req, res) => {
            const {id, status } = req.body
            const query = {_id: new ObjectId(id) }
            const updateBooking = {
                $set: {
                    status: status,
                },
            };
            const result = await packageBookingCollection.updateOne(query, updateBooking);
            res.send(result);
        });

        // booking by user
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = {
                name: booking.name,
                userEmail: booking.userEmail
            }
            const alreadyBooked = await packageBookingCollection.findOne(query)
            if (alreadyBooked) {
                return res
                    .status(400)
                    .send('You already Booked')
            }
            const result = await packageBookingCollection.insertOne(booking);
            res.send(result)
        })
        // delete booking by user 
        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await packageBookingCollection.deleteOne(query)
            res.send(result)
        })

        // ============ wishlist api ============//
        // get wishlist by user email
        app.get('/wishList/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email }
            const result = await wishListCollection.find(query).toArray()
            res.send(result)
        })
        // wishlist details 
        app.get('/wishList/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await wishListCollection.findOne(query);
            res.send(result)
        })

        // add wishlist by user
        app.post('/wishList', async (req, res) => {
            const package = req.body;
            const query = {
                name: package.name,
                userEmail: package.userEmail
            }
            const alreadyListed = await wishListCollection.findOne(query)
            if (alreadyListed) {
                return res.status(400).send('Already listed')
            }
            const result = await wishListCollection.insertOne(package);
            res.send(result)
        })

        // delete wishlist by user
        app.delete('/wishList/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await wishListCollection.deleteOne(query)
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