const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nlpzidc.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        // await client.connect();
        console.log('database connected');
        const productCollection = client.db('cameragraphy').collection('products');
        const purchaseCollection = client.db('cameragraphy').collection('purchase');
        const userCollection = client.db('cameragraphy').collection('users');
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.limit(6).toArray();
            res.send(products);
        })
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        })
        app.get('/explore', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })
        //user put
        app.put('/user/:email', async(req, res)=>{
            const email= req.params.email;
            const user= req.body;
            const filter= {email: email};
            const options= {upsert: true};
            const updateDoc ={
                $set:user,
            };
            const result= await userCollection.updateOne(filter, updateDoc, options);
            res.send(result); 
        })

        //post purchased product
        app.post('/purchased', async (req, res) => {
            
            const purchased = req.body;
            const result = await purchaseCollection.insertOne(purchased);
            res.send(result);
        })
        //get purchased
        app.get('/purchased', async(req, res)=>{
            console.log(req.query.body)
            const email= req.query.email;
            const query = {email: email};
            const cursor = purchaseCollection.find(query);
            const purchased = await cursor.toArray();
            res.send(purchased);
        })

        // app.get('/purchased', async (req, res) => {
        //     const query = {};
        //     const cursor = purchaseCollection.find(query);
        //     const purchased = await cursor.toArray();
        //     res.send(purchased);
        // })
       
       
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello from cameragraphy')
})

app.listen(port, () => {
    console.log(`cameragraphy app listening on port ${port}`)
})