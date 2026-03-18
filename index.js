const express = require("express");
const app = express();
const fs = require("fs").promises;
const bcrypt = require("bcryptjs");
const port = process.env.port || 3000;

app.listen(port,()=>{
    console.log("http://localhost:" + port);
});

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("client"));

const {getData, saveData, auth} = require("./function")


//routes
app.get("/posts", async (req,res)=>{
    const posts = await fs.readFile("posts.json");
    res.json(JSON.parse(posts));
});


//Create
app.post("/create", async (req,res)=>{
    const post = req.body;
    post.id = "id_" + Date.now();

    //När sessions implementeras ska detta läggas till
    // prod.uid = req.session.uid;

    const allPosts = await getData("posts.json");
    allPosts.push(post);

    await saveData(allPosts, "posts.json");
    res.json(post);
});

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

//delete
app.delete("/posts/:id", async (req,res) => {
    const allPosts = await getData("posts.json");
    let filteredPosts = allPosts.filter(p=>p.id != req.params.id);
    
    //ingen tas bort
    if(filteredPosts.length == allPosts.length)
    {
        return res.status(400).json({error:"nothing deleted"})
    }
    await saveData(filteredPosts, "posts.json");
    res.status(200).json({message:"deleted"})

});

//edit..
app.put("/posts/:id", async (req,res)=>{
    const id = req.params.id
    const allPosts = await getData("posts.json");
    const updatedPost = allPosts.find(p=>p.id == id);
    if(!updatedPost)return res.status(404).json({success: false, message: "Post doesn't exist"})

    updatedPost.title= req.body.title || updatedPost.title;
    updatedPost.description= req.body.description || updatedPost.description;
    updatedPost.photo= req.body.photo || updatedPost.photo;

    await saveData(allPosts, "posts.json");

    res.status(200).json({success:true, message:"Post has been updated"})

});

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
 
    // If you want session support, add express-session middleware and uncomment these lines:
    // req.session.auth = true;
    // req.session.uid = account.uid;
 
    res.status(200).json({account, success: true, message: "Login success"});
    console.log(account);
});
