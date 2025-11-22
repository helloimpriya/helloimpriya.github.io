import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, doc, getDoc, updateDoc, setDoc, onSnapshot,
  collection, query, where, addDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9QD1WYW-aStDNfGeeigdeM-YcIOaUMo0",
  authDomain: "priya-s-blog.firebaseapp.com",
  projectId: "priya-s-blog",
  storageBucket: "priya-s-blog.firebasestorage.app",
  messagingSenderId: "156553954536",
  appId: "1:156553954536:web:3c93b80f97006b7bb8755d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentPost = null;

// ---------------------
// Get slug from URL
// ---------------------
const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");

// Get or create unique user ID
function getUserId() {
  let userId = localStorage.getItem("priya_blog_user_id");
  if (!userId) {
    userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("priya_blog_user_id", userId);
  }
  return userId;
}

const userId = getUserId();
console.log("👤 User ID:", userId);

// DOM
const titleEl = document.querySelector(".post-title");
const dateEl = document.querySelector(".post-date");
const imageEl = document.querySelector(".post-image");
const contentEl = document.querySelector(".post-content");
const likesCountEl = document.querySelector(".likes-count");
const likesButton = document.getElementById("likesButton");
const commentsList = document.querySelector(".comments-list");

// ---------------------
// Particle Burst Animation
// ---------------------
function createParticles(button) {
  const rect = button.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.textContent = '❤️';
    particle.className = 'particle';
    particle.style.left = centerX + 'px';
    particle.style.top = centerY + 'px';
    particle.style.fontSize = '16px';

    // Random burst directions
    const angle = (i / 8) * Math.PI * 2;
    const distance = 80;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.style.setProperty('--tx', tx + 'px');
    particle.style.setProperty('--ty', ty + 'px');

    document.body.appendChild(particle);

    setTimeout(() => particle.remove(), 800);
  }
}

// ---------------------
// Load blog post & real-time likes
// ---------------------
// In the loadPost() function, update currentPost when you load the post data:

async function loadPost() {
  try {
    const postRef = doc(db, "posts", slug);

    onSnapshot(postRef, (snapshot) => {
      if (!snapshot.exists()) {
        titleEl.textContent = "Post not found 😭";
        console.error("Post with slug", slug, "not found");
        return;
      }

      const post = snapshot.data();
      currentPost = post; // ADD THIS LINE to store the post data
      
      console.log("✅ Post loaded:", post.title);

      titleEl.textContent = post.title?.trim() || "Untitled";
      dateEl.textContent = new Date(post.date.seconds * 1000).toDateString();
      imageEl.src = post.imageURL?.trim() || "";
      imageEl.alt = post.title || "Blog Image";
      contentEl.innerHTML = boldHeadings(post.content)?.trim() || "";
      calculateReadingTime(post.content);

      const likeCount = post.likes || 0;
      if (likesCountEl) {
        likesCountEl.textContent = `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`;
      }
    });
  } catch (error) {
    console.error("❌ Error loading post:", error);
    titleEl.textContent = "Error loading post";
  }
}

loadPost();

// ---------------------
// Check if user already liked
// ---------------------
async function checkUserLike() {
  try {
    const likeRef = doc(db, "likes", `${slug}_${userId}`);
    const likeSnap = await getDoc(likeRef);
    const heartIcon = likesButton.querySelector("ion-icon");

    if (likeSnap.exists()) {
      console.log("❤️ User already liked this post");
      likesButton.setAttribute("data-liked", "true");
      heartIcon.setAttribute("data-liked", "true");
      heartIcon.setAttribute("name", "heart"); // Filled heart
    } else {
      likesButton.setAttribute("data-liked", "false");
      heartIcon.setAttribute("data-liked", "false");
      heartIcon.setAttribute("name", "heart-outline"); // Outline heart
    }
  } catch (error) {
    console.error("❌ Error checking like:", error);
  }
}

checkUserLike();

// ---------------------
// Like Button Handler - Toggle Like
// ---------------------
if (likesButton) {
  likesButton.addEventListener('click', async () => {
    if (!slug) {
      console.error("❌ No slug found in URL");
      return;
    }

    const isLiked = likesButton.getAttribute("data-liked") === "true";
    const heartIcon = likesButton.querySelector("ion-icon");

    try {
      const postRef = doc(db, "posts", slug);
      const likeRef = doc(db, "likes", `${slug}_${userId}`);

      if (isLiked) {
        // Unlike: remove like from database
        console.log("💔 Removing like...");
        await deleteDoc(likeRef);
        await updateDoc(postRef, {
          likes: Math.max(0, (await getDoc(postRef)).data().likes - 1)
        });

        likesButton.setAttribute("data-liked", "false");
        heartIcon.setAttribute("data-liked", "false");
        heartIcon.setAttribute("name", "heart-outline"); // Outline heart
      } else {
        // Like: add like to database
        console.log("❤️ Adding like...");

        // Add animation
        likesButton.classList.add('liked');
        createParticles(likesButton);

        await setDoc(likeRef, {
          userId: userId,
          slug: slug,
          likedAt: new Date(),
          userAgent: navigator.userAgent
        });

        await updateDoc(postRef, {
          likes: (await getDoc(postRef)).data().likes + 1
        });

        likesButton.setAttribute("data-liked", "true");
        heartIcon.setAttribute("data-liked", "true");
        heartIcon.setAttribute("name", "heart"); // Filled heart

        // Remove animation class after animation completes
        setTimeout(() => {
          likesButton.classList.remove('liked');
        }, 400);
      }

      console.log('✅ Like toggled!');
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      alert('Failed to update like. Please try again.');
    }
  });
}

// ---------------------
// Load comments
// ---------------------
if (commentsList) {
  const commentsRef = collection(db, "comments");
  const commentsQuery = query(commentsRef, where("postSlug", "==", slug));

  onSnapshot(commentsQuery, (snapshot) => {
    console.log("📝 Comments loaded:", snapshot.docs.length);
    commentsList.innerHTML = "";

    snapshot.forEach((d) => {
      const c = d.data();
      const div = document.createElement("div");
      div.classList.add("comment-item");

      div.innerHTML = `
        <strong>${c.userName}</strong>
        <p>${c.commentText}</p>
      `;

      commentsList.appendChild(div);
    });
  });
}

// ---------------------
// Add comment
// ---------------------
const submitBtn = document.getElementById("submitComment");
if (submitBtn) {
  submitBtn.addEventListener("click", async () => {
    const nameInput = document.getElementById("username");
    const textInput = document.getElementById("commentText");
    const name = nameInput?.value?.trim();
    const text = textInput?.value?.trim();

    if (!name || !text) {
      alert("Please fill in both fields");
      return;
    }

    try {
      const commentsRef = collection(db, "comments");
      await addDoc(commentsRef, {
        postSlug: slug,
        userName: name,
        commentText: text,
        createdAt: new Date()
      });

      if (nameInput) nameInput.value = "";
      if (textInput) textInput.value = "";
      console.log("✅ Comment posted");
    } catch (error) {
      console.error("❌ Error posting comment:", error);
    }
  });
}
function calculateReadingTime(text) {
  const wordsPerMinute = 200; // standard reading speed
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);

  document.querySelector(".reading-time").textContent =
    `⏱ ${minutes} min read`;
}
const shareBtn = document.querySelector(".share-btn");

shareBtn.addEventListener("click", async () => {
  const url = window.location.href;

  if (!currentPost) {
    console.error("❌ Post data not loaded yet");
    alert("Please wait for the post to load...");
    return;
  }

  const title = currentPost.title || "Check out this blog post";
  const text = `Hey! I found this blog interesting ✨\n"${title}"\n\nRead it here:`;

  console.log("Share Title:", title);
  console.log("Share Text:", text);
  console.log("Share URL:", url);

  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: url
      });
      console.log("✅ Shared successfully");
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Share failed:", error);
      }
    }
  } else {
    // Fallback: Copy full message with link
    const fullMessage = `${title}\n\n${text}\n${url}`;
    try {
      await navigator.clipboard.writeText(fullMessage);
      console.log("📋 Copied:", fullMessage);
      shareBtn.textContent = "Copied! ✔";

      setTimeout(() => {
        shareBtn.textContent = "Share";
      }, 2000);
      console.log("✅ Copied to clipboard");
    } catch (error) {
      console.error("❌ Failed to copy:", error);
      alert("Failed to copy. Please try again.");
    }
  }
});



function boldHeadings(text) {
  return text
    .replace(/\[\[(.*?)\]\]/g, "<span class='post-heading'>$1</span>")
    .replace(/\n/g, "<br>");
}
