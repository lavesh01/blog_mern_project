const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');
const multer  = require('multer');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' })
const User = require('./models/User');
const Post = require('./models/Post');
const app = express();

app.use(cors({ credentials:true, origin:"http://localhost:3000"}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

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
                res.cookie('token',token).json({
                    id : userDoc._id,
                    username: username
                });
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

app.post('/post', upload.single('file'), async (req,res) => {
    const {title, summary , content} = req.body;
    const { originalname , path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length -1];
    const newPath =  path+'.'+ext; 
    fs.renameSync(path, newPath);

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
        if (err) throw err;
        
        const PostDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id
        });
        
        res.json(PostDoc);
    });

});

app.put('/post', upload.single('file'), async (req,res) => {
    
    const newPath = null;
    if(req.file){
        const { originalname , path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length -1];
        newPath =  path+'.'+ext; 
        fs.renameSync(path, newPath);
    }
    
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
        if (err) throw err;
        const {id,title, summary , content} = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if( !isAuthor ) {
            return res.status(400).json('You are not the author of this post');
        }

        postDoc.title = title;
        postDoc.summary = summary;
        postDoc.content = content;
        postDoc.cover = newPath ? newPath : postDoc.cover;
        await postDoc.save();
        
        res.json(postDoc);
    });
    
    

});

app.get('/post', async (req, res) => {
    try {
      const posts = await Post.find().populate('author',['username']);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

app.get('/post/:id', async (req,res) => {
    const { id } = req.params;
    const postDoc = await Post.findById(id).populate('author',['username']);
    res.json(postDoc);
})
  

// app.get('/post', async (req,res) => {
//     res.json(await Post.find().populate('author', ['username']));
// });

app.listen(4000);



