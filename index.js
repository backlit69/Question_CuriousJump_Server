const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const {initializeApp} = require('firebase/app')
const {getFirestore,doc,setDoc,getDoc,deleteDoc} = require('firebase/firestore')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
dotenv.config();

const serviceAccount = {
    "type": process.env.TYPE,
    "projectId": process.env.PROJECTID ,
    "private_key_id": process.env.PRIVATEKEYID,
    "private_key": process.env.PRIVATEKEY,
    "client_email": process.env.CLIENTEMAIL ,
    "client_id": process.env.CLIENTID ,
    "auth_uri": process.env.AUTHURI,
    "token_uri": process.env.TOKENURI ,
    "auth_provider_x509_cert_url": process.env.AUTHPROVIDER,
    "client_x509_cert_url": process.env.CLIENTURL,
    "universe_domain": process.env.UNIVERSEDOMAIN
  }



const FireStoreApp = initializeApp(serviceAccount);
const db = getFirestore();

//   const db = firestore();
 const collectionName = 'quizzes';


 const app = express();
 /*const corsOptions = {
    origin: ['http://localhost:3000',process.env.ALLOWED,'https://question-curious-jump-client.vercel.app/'], // Allow requests from this origin
    methods: ['GET', 'POST'],
    credentials :true  // Allow only specified HTTP methods
  };*/
  const corsOptions = {
    origin: "https://question-curious-jump-client.vercel.app",
    credentials: true,

}
app.use(cors(corsOptions));
  /*app.use(cors())
  app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "https://question-curious-jump-client.vercel.app");

    // Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    // Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Pass to next layer of middleware
    next();
});*/
app.use(express.json())

app.use(cookieParser())
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*'); // Replace '*' with specific origins if needed
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     // res.header('Access-Control-Allow-Credentials', true);
//     next();
//   });
// app.get("/",(req,res) =>{
//     res.setHeader("Access-Control-Allow-Credentials","true");
//     res.send("API is running");
//   });

const verifyUser = (req,res,next) =>{
    
    const token = req.cookies.token;
    if(!token){
        return res.json(" Token Unavailable")
    }
    else{
        jwt.verify(token,process.env.JWTSECRET,(err,decode)=>{
            if(err) return res.json(" Wrong Token")
                req.user = decode
                next()
        })
    }
}

app.get("/",verifyUser, async(req,res)=>{
    if(req.user.email==process.env.EMAIL){
        res.json({
            Success:true,
            message:"Valid Token"
        });
    }
    else{
        res.json({
            message:"Invalid Token"
        })
    }
    console.log(res.getHeaders())
    
})


app.post("/login",async(req,res)=>{
    console.log(req.body);
    console.log(process.env.EMAIL);
    if(req.body.email == process.env.EMAIL  && req.body.password == process.env.PASSWORD){
        const token = jwt.sign({email:req.body.email},process.env.JWTSECRET,{expiresIn:"1d"})
        res.cookie("token",token);
        res.status(200).json({
            success: true,
            user : "admin",
            message: `User Login Success`,
          });
    }
    else{
        return res
        .json({
          success: false,
          message: "Invalid cridentials",
        })
        .status(200);
    }
    console.log(res)
})


app.post("/question",async(req,res)=>{
    const data = req.body;
    const documentId = data.type+data.level;
    try{
        const docRef = doc(db,collectionName,documentId)
        let old_data = await getDoc(docRef);
        old_data = old_data.data();
        var questions = old_data.questions;
        console.log(questions);
        var am = []
        
        var question = {
                text : data.question,
                options:[data.option1,data.option2,data.option3,data.option4],
                correctAnswer : data.correctAnswer
            }
        if(questions===undefined){
            questions=[]
        }
        questions.push(question)
        var newData = {
            questions:questions,
            type:data.type,
            level:data.level
        }
        await deleteDoc(docRef);
        await setDoc(docRef, newData);
    }
    catch(err){
        console.log(err);
    }
    console.log(res)
})

app.listen(4000,()=>console.log("Up and Running at port 4000"))

