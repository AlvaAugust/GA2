# GA - Share Space
## Server

### Starta server

```js
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
```
Detta initierar en express-server. De olika "const" definerar olika saker som används senare i koden. Till exempel används express för att skapa webbservern, och fs för att möjliggöra asykron behandling av läsning och skrivning av filer. Dessutom skapas det en port som sedan används i "app.listen", som lyssnar på den angivna porten. Detta skrivs också ut i konsolen för att komma till sidan via en länk.
***
### Session och Cookies
```js
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))
```
Här möjliggörs sessioner i applikationen. Sessioner handlar om att spara ner information om en användare på webbsidan. Data sparas på servern medan en cookie i webbläsaren har en session med ett id, som kopplar den nuvarande användaren till rätt session. Detta är viktigt eftersom det kan finnas flera sessioner på samma webbsida samtidigt. Cookies (identifieringen) används senare i syfte att hantera att skapa, logga in och ut från konton. 
***
### Importerar Funktioner
```js
const {getData, saveData, auth} = require("./function")
```
Här importeras övriga funktioner som används flera gånger i koden.

#### Importerade Funktioner
```js
const fs = require("fs");
function saveData(data, fileName){
    return new Promise((resolve,reject)=>{
        fs.writeFile(fileName,JSON.stringify(data,null,3),(error)=>{
            if(error) reject(error.message);
            resolve();
        });
    });
};
function getData(dir){
    return new Promise((resolve, reject)=>{
        fs.readFile(dir,(error,data)=>{
            if(error) reject(error.message);
            resolve(JSON.parse(data.toString()));
        });
    });
};
function auth(req,res,next){
    if(!req.session.auth){
        return res.status(401).json({success: false, message: "Unauthorized"});
    }
    next();
};
module.exports = {getData, saveData, auth};
```
De importerade funktionerna handlar om att spara ner data, hämta data asynkront (Promise) och bestämma om en användare är auktoriserad att göra olika funktioner som finns på hemsidan.

***
### Routes
#### Posts
```js
app.get("/posts", async (req,res)=>{
    const postss = await fs.readFile("posts.json");
    const posts = JSON.parse(postss);

    const accounts = await getData("accounts.json")

    const postUsername = posts.map(post => {
        const account = accounts.find(acc => acc.uid == post.userid);

        return {
            ...post,
            username: account ? account.username : "Unknown"
        }
    });
    res.json(postUsername);
});
```
Här hämtas posts, som har sparats i en separat fil vid namn "posts.json". Denna fil blir läst, men använder något som heter "await", vilket betyder att den väntar att filen har lästs klart innan den går vidare till nästa steg. "JSON.parse" används för att omvandla datan i "posts.json" (listan som innehåller alla posts) till en java-script array vilket gör det hanterbart java-script och "map()" i detta fallet. Det hämtas också konton. Efter detta skapas en "map()" som hämtar kontons.uid (ett specifikt id för ett konto). Efter det returneras post, med ett account.username, men ifall det inte finns kommer det stå "Unknown". Slutligen skickas resultatet tillbaka till som en JSON till klienten. Den innehåller alla posts och ett användarnamn.

#### Create
```js
app.post("/create", auth, async (req,res)=>{
    const post = req.body;
    post.id = "id_" + Date.now();

    post.userid = req.session.userid

    const allPosts = await getData("posts.json");
    allPosts.push(post);

    await saveData(allPosts, "posts.json");
    res.json({...post, username:req.session.username});
});
```
För att använda denna routen måste man ha behörighet (auth), och i detta fallet får man det av att skapa ett konto. Ifall man har behörighet hämtar routen "body" och ger den konstanten post. På datan från req.body läggs ett id till. Det hämtas också userid från session, som får variablen post.userid. Sedan hämtas all data/posts som finns i posts.json (lista med alla posts), och sedan skickas den nygjorda posten som har id, och ett user id in i listan(posts.json) med hjälp av en push. Efter det används fuktionen saveData som sparar den nygjorda litan med den tillagda post i "posts.json". Senare skickas posten tillbaka till frontend/klienten tillsammans med användarnamnet. 


#### Delete
```js
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
```
Posts.json hämtas, sedan skapas postD, och letar igenom allt i posts.json efter ett id som matchar det av den som ska raderas. Ifall det id inte finns skickas ett error meddelande. Ifall postD och userid på posten som ska raderas inte är samma har man inte behörighet att radera. Sedan filtreras posts.json och en lista utan den raderade posten skapas. Sedan sparas den nya listan i posts.json. Sedan skickas det ett meddelande till klienten att förfrågan gick igenom. 



#### Update/Edit

```js
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
```
Detta är en route för redigering av posts. Det hämtas id, posts.json, och en "updatedPost" som endast hämtar den posten vars id matchar den som tidigare hämtas i params. Ifall updatedPost inte finns får man ett felmeddelande. Ifall id finns, men inte matchar det id som är i session är man inte behörig att redigera. Efter det updateras titel och description, det sparas och det skickas slutligen en ok status till klienten.

#### Register

```js
app.post("/register", async (req,res)=>{
    const { username, password } = req.body;
    
    if (!username || !username.trim() || !password || !password.trim()) {
        return res.status(400).json({ success: false, error: "Required" });
    }

    const accounts = await getData("accounts.json");
    const exist = accounts.find(acc => acc.username.toLowerCase() === username.trim().toLowerCase());

    if (exist) {
        return res.status(400).json({ success: false, error: "Username already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    const account = {
        uid: "uid_" + Date.now(),
        username: username.trim(),
        password: hashedPassword
    };

    accounts.push(account);
    await saveData(accounts, "accounts.json");

    return res.status(201).json({ success: true, account });
});
```
Register börjar med en post som har en konstant som hämtar ett username och ett password från body. Ifall användarnamnet som är inskrivet inte finns kommer ett error. Sedan hämtas "accounts.json" som innehåller alla konton. Alla konton i listan kollas igenom och ifall andvändarnamnet redan finns skickas det ett error till klienten. Ifall allting är okej blir lösenordet hashat, vilket gömmer det riktiga lösenordet. Sedan skickas den nya listan (gammal + nytt konto). och skickar ett ok meddelande till klienten. 

Funktionerna toLowerCase() och trim(), används för att hitta alla möjliga användarnamn. Kanske är det stora bokstäver på olika ställen, då görs allting om till små bokstäver för att man inte ska kunna ha samma kombination av bokstäver. Ibland kan man ha råkat sätta ett mellanslag i början och då klipps det bort innan kontot skapas (trim()).

#### Login

```js
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
```
Login hämtar username och password från body. Ifall antingen username eller password inte finns blir det error. konto-listan hämtas, kontot som försöker loggas in hittas i listan. Ifall användarnamnet som försöker logga in inte finns får man error. Det inskrivna och hashade lösenorden jämnförs med varandra, inte samma = error. Ifall allting går igenom hämtas userid, username och auth blir true, och ett success meddelande skickas till klienten


#### Logout

```js
app.post("/logout", (req,res)=>{
    req.session.destroy()
    res.json({ success: true, message: "Logged out"});
})
```
Logout förstör session som tidigare fanns, och skickar ett success meddelande till klienten. 

#### Login-check

```js
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
```
Ifall session.userid inte finns är loggedIn inte sant. Men ifall dey är det är loggedIn true. 


***

## Client






### Start React
```jsx
ReactDOM.createRoot(document.querySelector("#root")).render(<App></App>);
```
Detta startar react. Det hämtas ett element i HTML där App ska synas, sedan renderas App på sidan.

### App
```jsx
function App() {
    const [post, setPost] = React.useState([]);
    const [editingPost, setEditingPost] = React.useState(null);
    const [currentUser, setCurrentUser] = React.useState(null);
    React.useEffect(() => {
```
App är komponenten på sidan där allting sammanställs och sedan visas. Det finns flera konstanter som skrivs in i syfte av att användas i senare funktioner. 


```jsx
    const [editingPost, setEditingPost] = React.useState(null);
    const [currentUser, setCurrentUser] = React.useState(null);
```

Konstanterna består av två olika värden, en av nuvarande värde och det uppdaterade värdet. "React.useSatte(null)" står för att det inte används vid detta tillfälle, som används vid uppdatering av en produkt eller ifall en användare är inloggad, eftersom det inte sker hela tidan är den default-värdet null. 

```jsx
React.useEffect(() => {
        async function checkLogin() {
            try {
                const res = await fetch("/me", {
                    method: "GET",
                    credentials: "include"
                });
                const data = await res.json();
                if (res.ok && data.loggedIn) {
                    setCurrentUser(data.user);
                } else {
                    setCurrentUser(null);
                }
            } catch (err) {
                console.error("Session check failed", err);
                setCurrentUser(null);
            }
        }
        checkLogin();
    }, []);
```
"React.useEffect()" körs en gång vid start, och kör asynkront funktionen "checkLogin" som kollar ifall en man är inloggad på ett konto eller inte. Det skickas en "request" till servers "/me" som ska innehålla sessionen. Det ändras sedan till javascript för att klienten ska kunna hantera informationen. Try och catch håller koll om något är fel och har återgärd.  Ifall användaren är inloggod sparas datan i "currentUser", annars blir det null. Ifall en återgärd behövs skickas ett felmeddelande till konsolen och användaren blir får en utloggad status. 


```jsx
const editPost = (id) => {
        const postToEdit = post.find(p => p.id === id);
        setEditingPost(postToEdit);
    }
```
Sedan skapas denna för att kunna ändra i en specifik post. Då letas ett speciellt id upp i en lista, och "find()" skickar resultatet och sparas.

#### React-komponenter
```jsx
    return (
        <div>
            <Header currentUser={currentUser}></Header>
            <EditPost editingPost={editingPost} setEditingPost={setEditingPost} setPost={setPost}></EditPost>
            <Create setPost={setPost}></Create>
            <Fyp post={post} setPost={setPost} editPost={editPost} currentUser={currentUser}></Fyp>
            <Register></Register>
            <Login setCurrentUser={setCurrentUser}></Login>
            <Logout currentUser={currentUser} setCurrentUser={setCurrentUser}></Logout>
        </div>
    );
```
Detta är fortsättningen av App. Sidan är har flera React-komponenter vars funktioner finns här. Datan som tidigare har hämtas skickas in i den komponenten där konstanten står. T.ex behöver Login "setCurrentUser" eftersom den sätter ett nytt värde på "currentUser".


### Header
```jsx
function Header({ currentUser }) {
    return (
        <header>
            <div id="title"> <h1 >✦•┈๑⋅⋯ Share Space ⋯⋅๑┈•✦</h1></div>
            <nav>
                <a href="/">HOME</a>
                {!currentUser && <a href="#register">REGISTER</a>}
                {!currentUser && <a href="#login">LOG IN</a>}

                {currentUser && <a href="#create">CREATE</a>}
                {currentUser && <a href="#logout">LOG OUT</a>}
            </nav>
            {currentUser && (
                <div id="title" className="title">
                    <h4>Welcome "{currentUser.username}"!</h4>
                </div>
            )}
        </header>
    );
};
```
Header är en react-komponent som finns för alla som besöker webbsidan och är fyllt av olika länkar (routes). Dock varierar den beroende på vem det är. "HOME" är tillgängligt till alla. Ifall man inte har en "currentUser" (inloggad) kommer man se "REGISTER" "LOG IN". Om man är inloggad syns istället; "CREATE", "LOG OUT" och en del under vars kontonamnet blir välkomnat till sidan. 

"currentUser" är en prop som komponenten "Header" tar emot, det är en status som berättar om en användare är inloggad eller inte. 

***

### Startsida
```jsx
function Fyp({ post, setPost, editPost, currentUser }) {
    React.useEffect(() => {
        getPost();
    }, []);
    async function getPost() {
        const res = await fetch("/posts");
        const data = await res.json();
        setPost(data);
        console.log(data);
    };
```
Detta är startsidan som använder sig och tar emot flera props. Props inehåller; lista med inlägg, uppdatera post, redigera post och inloggningsstatus. "getPost()" körs på direkten och hämtar alla posts från servern. En asynkron funktion hämtar data från serven/backend. Sedan omvandlas datan till en javascript-array. Datan skrivs också ut i konsolen.

#### Delete post
```jsx
    async function deletePost(id) {
        const confirm = window.confirm("Delete this product?")
        if(!confirm) return;

        const res = await fetch("/posts/" + id, {
            method: "DELETE",
            credentials: 'include'
        });
        if (res.ok)
            setPost(prev => prev.filter(p => p.id != id));
    };
```
Asynkron funktion som raderar en post med ett specifikt id. Confirm är en bekräftelse som stoppar eller genomför raderingen. Det skickas en delete och cookies request till servern/backend med en fetch. Ifall det lyckas uppdateras listan av posts, en ny lista skapas där posten med det specifika id är borttagen.


#### HTML-kod
```jsx
    return (
        <div>
            <div id="title"><h2>FYP</h2></div>
            {post.map(p => (
                <div className="post" key={p.id}>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                    <small>Posted by: {p.username}</small>
                    <br />
                    {currentUser && currentUser.uid === p.userid && (
                        <>
                            <button onClick={() => deletePost(p.id)}>Delete</button>
                            <button onClick={() => editPost(p.id)}>Edit</button>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};
```
Detta är HTML kod, för hur webbsidan ska se ut för användaren. Knappar som delete och edit syns endast om "currentUser" och det kontot som har skapat post har samma unika userid. 


***

### Create
```jsx
function Create({ setPost }) {
    async function savePost(event) {
        event.preventDefault(); //stoppar webbsidan från att reload
        const confirm = window.confirm("Create this product?")
        if(!confirm) return;

        const post = {
            title: event.target.title.value,
            description: event.target.description.value
        };

        const res = await fetch("/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(post),
            credentials: 'include'
        });

        const data = await res.json();
        console.log(data);
        setPost(prev => [data, ...prev]); //new post appears on top of list, doesn't need to refetch
        window.location.href = '#'
    }
```


```jsx
return (
        <div id="create" className="content">
            <h1>Create a post</h1>
            <form action="/create" method="post" onSubmit={savePost}>
                <input type="text" name="title" placeholder="Title" maxLength={64} required />
                <textarea name="description" placeholder="Description" required></textarea>
                <button type="submit">Create Post</button>
                <button type="button">Cancel</button>
            </form>
        </div>
    );
```


### Update/Edit
```jsx
```

### Register
```jsx
```

### Login
```jsx
```

### Logout
```jsx
```
