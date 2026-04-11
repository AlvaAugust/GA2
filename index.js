const express = require("express");
const app = express();
const fs = require("fs").promises;
const bcrypt = require("bcryptjs");
const port = process.env.port || 3000;
const session = require("express-session")

app.listen(port,()=>{
    console.log("http://localhost:" + port);
});

app.use(express.json()); //tillåter json res.json osv..
app.use(express.urlencoded({extended:true}));
app.use(express.static("client"));

//cookies
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

const {getData, saveData, auth} = require("./function")


//routes
app.get("/posts", async (req,res)=>{
    try{
        const postss = await fs.readFile("posts.json");
        const posts = JSON.parse(postss); //covert data

        const accounts = await getData("accounts.json")

            const postUsername = posts.map(post => {
                const account = accounts.find(acc => acc.uid == post.userid);

                return {
                    ...post,
                    username: account ? account.username : "Unknown"
                }
            });

            res.json(postUsername);
    } catch (err) {
        console.error("posts failed", err);
        res.status(500).json({ error : "Posts went wrong"})
    }
    
});


//Create
app.post("/create", auth, async (req,res)=>{
    

    const post = req.body;
    post.id = "id_" + Date.now();

    post.userid = req.session.userid

    const allPosts = await getData("posts.json");
    allPosts.push(post);

    await saveData(allPosts, "posts.json");
    res.json({...post, username:req.session.username});
});


//delete
app.delete("/posts/:id", auth, async (req,res) => {
    const allPosts = await getData("posts.json");

    const postD = allPosts.find(p => p.id == req.params.id);
    if (!postD) {
        return res.status(404).json({error: "Post not found"});
    }

    if (postD.userid != req.session.userid) {
        return res.status(403).json({error: "You are not authorized to delete this"});
    }

    let filteredPosts = allPosts.filter(p => p.id != req.params.id);
    
    await saveData(filteredPosts, "posts.json");
    res.status(200).json({message: "deleted"});
});

//edit..
app.put("/posts/:id", auth, async (req,res)=>{
    const id = req.params.id
    const allPosts = await getData("posts.json");
    const updatedPost = allPosts.find(p=>p.id == id);
    if(!updatedPost)return res.status(404).json({success: false, message: "Post doesn't exist"})

    if (updatedPost.userid != req.session.userid) {
        return res.status(403).json({error: "You are not authorized to edit this"});
    }

    updatedPost.title= req.body.title || updatedPost.title;
    updatedPost.description= req.body.description || updatedPost.description;
    await saveData(allPosts, "posts.json");

    res.status(200).json({success:true, message:"Post has been updated"})

});

//register
app.post("/register", async (req,res)=>{
    const { username, password } = req.body;

    //trim() ifall space är innan namnet så tas det bort
    if (!username || !username.trim() || !password || !password.trim()) {
        return res.status(400).json({ success: false, error: "Required" });
    }

    const accounts = await getData("accounts.json");
    const exist = accounts.find(acc => acc.username.toLowerCase() === username.trim().toLowerCase());
    if (exist) {
        return res.status(400).json({ success: false, error: "Username already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    //trim tar bort mellanslaget framför
    const account = {
        uid: "uid_" + Date.now(),
        username: username.trim(),
        password: hashedPassword
    };

    accounts.push(account);
    await saveData(accounts, "accounts.json");

    return res.status(201).json({ success: true, account });
});

//login
app.post("/login", async(req,res)=>{
 
    const username = req.body.username;
    const password = req.body.password;
 
    if(!username || !password)
        return res.status(400).json({success: false, message: "username and password required"});
 
   
 
    const accounts = await getData("accounts.json");
    const account = accounts.find(u => u.username == username);
 
    if(!account)
        return res.status(401).json({success: false, message: "Invalid username or password"});
 
    const hashedPassword = await bcrypt.compare(password, account.password);
 
    if(!hashedPassword)
        return res.status(401).json({success: false, message: "Invalid username or password"});

    req.session.userid = account.uid
    req.session.username = account.username;
    req.session.auth = true
     
    res.status(200).json({account, success: true, message: "Login success"});
    console.log(account);
});

//logout
app.post("/logout", (req,res)=>{
    req.session.destroy()
    res.json({ success: true, message: "Logged out"});
})


app.get("/me", auth, async (req,res)=>{

    if(!req.session.userid){
        return res.status(401).json({loggedIn: false});
    }
    res.json({
        loggedIn: true,
        user: {
            uid: req.session.userid,
            username: req.session.username
        }
    });
});

