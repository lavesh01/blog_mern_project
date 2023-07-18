const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');

const User = require('./models/User');
const app = express();

app.use(cors({ credentials:true, origin:"http://localhost:3000"}));
// app.use(cors());
app.use(express.json());
app.use(cookieParser());

const salt = bcrypt.genSaltSync(10);
const secret = "laksjdflkajslkfjalksf";

mongoose.connect('mongodb+srv://admin-lavesh:admin123@cluster0.agz64.mongodb.net/blogDB');

app.post("/register", async (req,res) => {
    const { username, password } = req.body;
    try{
        const userDoc = await User.create({ 
            username, 
            password : bcrypt.hashSync( password, salt)
        });
        res.json(userDoc);
    }catch(e){
        res.status(400).json(e);
    }
})

app.post("/login", async (req,res) => {
    const { username, password } = req.body;
    
        const userDoc = await User.findOne({ username: username });
        const passOk = bcrypt.compareSync( password, userDoc.password)
       
        if(passOk){
            jwt.sign({ username, id: userDoc._id }, secret , {}, function(err, token) {
                if(err) throw err;
                res.cookie('token',token).json('ok');
            });
        }else{
            res.status(400).json("Wrong Credentials");
        }
})

app.get("/profile", (req,res) => {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, (err,info) => {
        if (err) throw err;
        res.json(info);
    });

});

app.get("/logout", (req,res) => {
    res.cookie('token','').json('ok');
});

app.listen(4000);



