const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nlpzidc.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'}) ;
    }
    const token= authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET , function (err, decoded) {
        if(err){
            return res.status(403).send({message: 'Forbidden Access'})
        }
        req.decoded= decoded; 
        next();
    });

}

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

        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })

        app.get('/admin/:email', async(req, res)=>{
            const email= req.params.email;
            const user= await userCollection.findOne({email: email});
            const isAdmin = user.role=== 'admin';
            res.send({admin: isAdmin})
        })

        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester=req.decoded.email; 
            const requesterAccount= await userCollection.findOne({email: requester});
            if(requesterAccount.role==='admin'){
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);

                res.send(result);
            }
            else{
                res.status(403).send({message: 'forbidden'});
            }
            
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
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({result, token}); 
        })

        //post purchased product
        app.post('/purchased', async (req, res) => {
            
            const purchased = req.body;
            const result = await purchaseCollection.insertOne(purchased);
            res.send(result);
        })

        app.post('/newProduct', async(req, res)=>{
            const newProduct= req.body;
            console.log(newProduct)
            const result=await productCollection.insertOne(newProduct);
            res.send(result);
        })

        //get purchased
        app.get('/purchased', verifyJWT, async(req, res)=>{
            // console.log(req.query.body)
            const email= req.query.email;
            const decodedEmail= req.decoded.email;
            if(email===decodedEmail){
                const query = { email: email };
                const cursor = purchaseCollection.find(query);
                const purchased = await cursor.toArray();
                return res.send(purchased);
            }
            else{
                return res.status(403).send({message:'Forbidden Access'})
            }
            
        })
        app.get('/allorders', async (req, res) => {
            const query = {};
            const cursor = purchaseCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })
       
       
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