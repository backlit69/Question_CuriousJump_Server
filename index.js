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
 const corsOptions = {
    origin: ['http://localhost:3000',process.env.ALLOWED,'https://question-curious-jump-client.vercel.app'], // Allow requests from this origin
    methods: ['GET', 'POST'],
    credentials :true  // Allow only specified HTTP methods
  };

app.use(express.json())
app.use(cors(corsOptions))
app.use(cookieParser())

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
    return res;
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
    
    // const collectionRef = collection(db,collectionName)
    // const q = (collectionRef)
    
    // const docSnap = await getDoc(q);
    // console.log(docSnap);
    // res.status(200).json({
    //     message:"question added"
    //   });
    // return res;

})




app.listen(4000,()=>console.log("Up and Running at port 4000"))

