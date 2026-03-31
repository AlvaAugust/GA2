ReactDOM.createRoot(document.querySelector("#root")).render(<App></App>);

// ALLA FUNKTIONER MED STOR BOKSTAV
function App() {


    const [post, setPost] = React.useState([]);
    const [editingPost, setEditingPost] = React.useState(null);



    //kollar vilken användare MÅSTE LÄRA DIG
    const [currentUser, setCurrentUser] = React.useState(null);
    React.useEffect(() => {
        //vrf local storage och get Item
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);


    //lär dig
    const editPost = (id) => {
        const postToEdit = post.find(p => p.id === id);
        setEditingPost(postToEdit);
    };


    //currentUser={currentUser} FYP     setCurrentUser={setCurrentUser}></Login>
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
};

function Header({ currentUser }) {
    return (
        <header>
            <div id="title"> <h1 >✦•┈๑⋅⋯ Forum ⋯⋅๑┈•✦</h1></div>

            <nav>

                {/* för alla */}
                <a href="/">HOME</a>

                {/* ifall utloggad.. */}
                {!currentUser && <a href="#register">REGISTER</a>}
                {!currentUser && <a href="#login">LOG IN</a>}

                {/* endast ifall inloggad */}
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

function Fyp({ post, setPost, editPost, currentUser }) {

    React.useEffect(() => {
        getPost();
    }, []);


    //hämtar posts
    async function getPost() {
        const res = await fetch("/posts");
        const data = await res.json();
        setPost(data);
        console.log(data);
    };


    //raderar posts
    async function deletePost(id) {

        const confirm = window.confirm("Delete this product?")
        if(!confirm) return;

        const res = await fetch("/posts/" + id, {
            method: "DELETE",
            credentials: 'include'
        });
        if (res.status == 200)
            setPost(prev => prev.filter(p => p.id != id));
    };


    return (
        <div>
            <div id="title"><h2>FYP</h2></div>
            {post.map(p => (
                <div className="post" key={p.id}>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                    <small>Posted by: {p.username}</small>
                    <br />


                    {/* ifall currentUser och currentUser.uid matchar posts p.userid visas delete och edit */}
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

        window.location.href = '#'//add this to everything
    }


    return (
        <div id="create" className="content">
            <h1>Create a post</h1>
            <form action="/create" method="post" onSubmit={savePost}>
                <input type="text" name="title" placeholder="Title" maxLength={64} required />
                <textarea name="description" placeholder="Description" required></textarea>
                <button type="submit">Create Post</button>
                <button type="button" onClick={() => window.location.href = '#'} style={{ marginLeft: '0.5rem' }}>Cancel</button>
            </form>
        </div>
    );
};

//update a post
function EditPost({ editingPost, setEditingPost, setPost }) {

    async function EditPostF(event) {
        event.preventDefault();

        const confirm = window.confirm("Edit this product?")
        if(!confirm) return;


        const updatedPost = {
            title: event.target.title.value || editingPost.title,
            description: event.target.description.value || editingPost.description,
        };


        const res = await fetch("/posts/" + editingPost.id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedPost),
            credentials: 'include'
        });

        const data = await res.json();

        console.log("status", res.status, data.message);

        //vad betyder detta
        if (res.ok) {
            setPost(prev =>
                prev.map(p =>
                    p.id == editingPost.id ? { ...p, ...updatedPost } : p
                )
                //if p.id == editingPost.id -> händer grej 1 , ifall inte sant händer grej 2(p)
                //...p   vad betyder
            );
            setEditingPost(null); // close edit form
        }
    }

    if (!editingPost) return null; // don't render if no post to edit

    return (
        <div className="editDiv">
            <form onSubmit={EditPostF}>
                <input type="text" name="title" placeholder="Title" defaultValue={editingPost.title} maxLength={64} />
                <input type="text" name="description" placeholder="Description" defaultValue={editingPost.description} />
                <input type="submit" value="Save" />
                <button type="button" onClick={() => setEditingPost(null)}>Cancel</button>
            </form>
        </div>
    )

};
// defaultValue={}   visar vad den har för value, prefilling a form

function Register() {

    const [message, setMessage] = React.useState(""); //skapar ett medddelande under
    async function saveAccount(event) {

        const confirm = window.confirm("Create this account?")
        if(!confirm) return;


        event.preventDefault(); //stoppar webbsidan från att reload


        const account = {
            username: event.target.username.value,
            password: event.target.password.value
        };


        const res = await fetch("/register", {
            method: "POST",
            //säger vad man skickar med, förbereder sig för json     MELKER LJUGER
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(account)
        });


        const data = await res.json();


        if (!data.success) {
            setMessage(data.error || "Registration failed");
            return;
        }


        setMessage("Registration successful");
        event.target.username.value = "";
        event.target.password.value = "";

        window.location.href = '#';
    }

    return (

        <div id="register" className="content">
            <h1>Register a new account</h1>
            <h3 className="errorMessage">{message}</h3>
            <form onSubmit={saveAccount}>
                <input type="text" name="username" placeholder="Username" maxLength={20} required />
                <input type="password" name="password" placeholder="Password" minLength={4} required />
                <button type="submit">Create Account</button>
                <button type="button" onClick={() => window.location.href = '#'} style={{ marginLeft: '0.5rem' }}>Cancel</button>
            </form>

        </div>
    )
};


function Login({setCurrentUser}){
    const [message, setMessage] = React.useState("");

    async function login(event){


        event.preventDefault();

        const account={
            username: event.target.username.value,
            password: event.target.password.value
        };

        const res = await fetch("/login",{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(account),
            credentials: 'include'
        })

        const data = await res.json();
        if (!res.ok){
            setMessage(data.message || "Login failed");
            return
        }

        setMessage("Login successful!");
        console.log("Account logged in: ", data.account);

        //erm help!
        localStorage.setItem("currentUser", JSON.stringify(data.account));
        setCurrentUser(data.account);

        window.location.href = '#';
        
    }

    return(
        <div id="login" className="content">
            <h1>Log in to your account</h1>
            <form action="/login" onSubmit={login} method="post">
                <input type="text" name="username" placeholder="Username" />
                <input type="password" name="password" placeholder="Password" minLength={4} />
                <input type="submit" value="Log in" />
                <button type="button" onClick={() => window.location.href = '#'} style={{ marginLeft: '0.5rem' }}>Cancel</button>
            </form>
            {message && <p>{message}</p>}

        </div>
    )
}





//logout
function Logout({ currentUser, setCurrentUser }) {
    //currentUser = who,    setCurrentUser = updates the user


    const [message, setMessage] = React.useState("");
    //text shown to user -> update the text


    //hämtar /logout från /logout post från index.js
    async function logout() {
        const res = await fetch("/logout", {
            method: "POST",
            credentials: 'include' //sends cookies
        });
        const data = await res.json(); //converts to json data


        //ifall logout blev hämtad och fungerade
        if (res.ok) {
            localStorage.removeItem("currentUser"); //radera localstorage data, minns inte den efter
            setCurrentUser(null); //säger att ingen är inloggad efter detta
            setMessage("Logged out successfully");
        }
    }
    if (!currentUser) return null; //if no currentUser render nothing

    //
    return (
        <div id="logout" className="content">
            <h1>Logged in as {currentUser.username}</h1>
            <button onClick={logout}>Log Out</button> {/* logout() function */}
            {message && <p>{message}</p>}
        </div>
    )
};