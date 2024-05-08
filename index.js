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
    // origin: "http://localhost:3000",
    credentials: true,

}
app.use(cors(corsOptions));
app.use(express.json())
app.use(cookieParser())

const verifyUser = (req,res,next) =>{
    console.log(req.body);
    const auth = req.body.auth;
    
    if(!auth){
        return res.json({success:false ,message : "Token Unavailable"})
    }
    else{
        jwt.verify(auth,process.env.JWTSECRET,(err,decode)=>{
            if(err) return res.json({success:false ,message : "Wrong Token"})
                req.user = decode
                next()
        })
    }
}

app.post("/auth",verifyUser, async(req,res)=>{
    if(req.user.email==process.env.EMAIL){
        res.json({
            success:true,
            message:"Valid Token"
        });
    }
    else{
        res.json({
            success:false,
            message:"Invalid Token"
        })
    }
    console.log(res.getHeaders())
    
})

app.post("/logout",async(req,res)=>{
    res
  .status(200)  //OK
  .clearCookie("auth")
  .send("Cookie deleted from user's browser")
})


app.post("/login",async(req,res)=>{
    console.log(req.body);
    console.log(process.env.EMAIL);
    if(req.body.email == process.env.EMAIL  && req.body.password == process.env.PASSWORD){
        const auth = jwt.sign({email:req.body.email},process.env.JWTSECRET,{expiresIn:"1d"})
        const options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            httpOnly: true,
          };

        res.json({
            success: true,
            user : "admin",
            message: `User Login Success`,
            auth : auth
          }).status(200);
    }
    else{
        return res
        .json({
          success: false,
          message: "Invalid cridentials",
        })
        .status(200);
    }
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
        res.json({
            success: true,
            message: "Question added",
          })
          .status(200);
    }
    catch(err){
        console.log(err);
        res.json({
            success: false,
            message: "Can't add question",
          })
          .status(300);
    }
    
    
})

app.listen(4000,()=>console.log("Up and Running at port 4000"))

