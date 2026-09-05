import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);

  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [newPostImage, setNewPostImage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLoginView) {
        const res = await axios.post(`${API_URL}/auth/login`, {
          email,
          password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      } else {
        await axios.post(`${API_URL}/auth/signup`, {
          username,
          email,
          password,
        });
        setIsLoginView(true);
        alert("Signup successful! Please login.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error occurred");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    // let maxsize = 128*1024;
    // if(file.size > maxsize){
    //   alert("File must be less than 128kb");
    //   e.target.value = "";
    //   return;
    // }
    const reader = new FileReader();
    reader.onloadend = () => setNewPostImage(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const createPost = async () => {
    try {
      if (!newPostText && !newPostImage) return;
      const res = await axios.post(
        `${API_URL}/posts`,
        { text: newPostText, image: newPostImage },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log(res)
      setPosts([res.data, ...posts]);
      setNewPostText("");
      setNewPostImage("");
      setShowCreateModal(false);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "File size too large")
    }
  };

  const handleLike = async (postId) => {
    const res = await axios.post(
      `${API_URL}/posts/${postId}/like`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    setPosts(posts.map((p) => (p._id === postId ? res.data : p)));
  };

  const handleComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text) return;
    const res = await axios.post(
      `${API_URL}/posts/${postId}/comment`,
      { text },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    setPosts(posts.map((p) => (p._id === postId ? res.data : p)));
    setCommentInputs({ ...commentInputs, [postId]: "" });
  };

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>{isLoginView ? "Welcome Back" : "Create Account"}</h2>
          <form onSubmit={handleAuth}>
            {!isLoginView && (
              <input
                type="text"
                placeholder="Username"
                required
                onChange={(e) => setUsername(e.target.value)}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="primary-btn">
              {isLoginView ? "Login" : "Sign Up"}
            </button>
          </form>
          <p
            onClick={() => setIsLoginView(!isLoginView)}
            className="toggle-auth"
          >
            {isLoginView
              ? "New here? Create an account"
              : "Already have an account? Login"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="logo">TaskPlanet Social</div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      {/* Main Feed Container */}
      <div className="feed-container">
        {posts.map((post) => (
          <div key={post._id} className="post-card">
            {/* Post Header matching screenshot */}
            <div className="post-header">
              <div className="user-info-section">
                <div className="avatar">
                  {post.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-meta">
                  <div className="name-row">
                    <span className="display-name">{post.username}</span>
                    <span className="badge">4</span>
                    <span className="badge-platinum">💎 Platinum</span>
                  </div>
                  <div className="handle-row">
                    <span className="handle">
                      @{post.username.toLowerCase()}
                    </span>
                    <span className="dot">•</span>
                    <span className="time">1 hour ago</span>
                  </div>
                </div>
              </div>
              <div className="header-actions">
                {post.username !== user.username && (
                  <button className="follow-btn">Follow</button>
                )}
                <span className="more-options">•••</span>
              </div>
            </div>

            {/* Post Content */}
            <div className="post-content">
              {post.text && <p className="post-text">{post.text}</p>}
              {post.image && (
                <div className="post-image-container">
                  <img
                    src={post.image}
                    alt="Post content"
                    className="post-img"
                  />
                </div>
              )}
            </div>

            {/* Action Bar matching screenshot */}
            <div className="post-actions">
              <div
                className={`action-btn ${post.likes.includes(user.username) ? "liked" : ""}`}
                onClick={() => handleLike(post._id)}
              >
                <span className="icon">
                  {post.likes.includes(user.username) ? "❤️" : "🤍"}
                </span>
                <span className="count">{post.likes.length}</span>
              </div>
              <div className="action-btn">
                <span className="icon">💬</span>
                <span className="count">{post.comments.length}</span>
              </div>
              <div className="action-btn">
                <span className="icon">🔗</span>
                <span className="count">0</span>
              </div>
            </div>

            {/* Comments Section */}
            {post.comments.length > 0 && (
              <div className="comments-section">
                {post.comments.map((c, i) => (
                  <div key={i} className="comment-item">
                    <strong>{c.username}</strong>{" "}
                    <span className="comment-text">{c.text}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="comment-input-area">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentInputs[post._id] || ""}
                onChange={(e) =>
                  setCommentInputs({
                    ...commentInputs,
                    [post._id]: e.target.value,
                  })
                }
              />
              <button onClick={() => handleComment(post._id)}>Post</button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button (FAB) for Creating Post */}
      <button className="fab" onClick={() => setShowCreateModal(true)}>
        +
      </button>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Create a Post</h3>
            <textarea
              placeholder="What's on your mind?"
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
            />
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <h5>Choose file upto 128kb</h5>
            {newPostImage && (
              <img src={newPostImage} alt="Preview" className="preview-img" />
            )}
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button className="post-btn" onClick={createPost}>
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
