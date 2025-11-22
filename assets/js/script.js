'use strict';

// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function () {

    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

    testimonialsModalFunc();

  });

}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);



// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () { elementToggleFunc(this); });

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);

  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {

  for (let i = 0; i < filterItems.length; i++) {

    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {

  filterBtn[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

  });

}



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {

    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }

  });
}


// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

navigationLinks.forEach(link => {
  link.addEventListener("click", () => {

    const targetPage = link.textContent.trim().toLowerCase();
    
    console.log("🔍 Clicked nav:", targetPage);
    console.log("📄 Available pages:", Array.from(pages).map(p => p.dataset.page));

    pages.forEach(page => {
      if (page.dataset.page === targetPage) {
        console.log("✅ Found matching page:", targetPage);
        page.classList.add("active");
      } else {
        page.classList.remove("active");
      }
    });

    navigationLinks.forEach(nav => nav.classList.remove("active"));
    link.classList.add("active");

    window.scrollTo(0, 0);

    // Load blog posts when blog is clicked
    if (targetPage === "blog") {
      console.log("📝 Loading blog posts...");
      loadBlogPosts();
    }
  });
});

// --------------------------
// BLOG FETCHING (Firebase)
// --------------------------

// Import modules (top of file doesn't work unless file is module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB9QD1WYW-aStDNfGeeigdeM-YcIOaUMo0",
  authDomain: "priya-s-blog.firebaseapp.com",
  projectId: "priya-s-blog",
  storageBucket: "priya-s-blog.firebasestorage.app",
  messagingSenderId: "156553954536",
  appId: "1:156553954536:web:3c93b80f97006b7bb8755d"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// BLOG LIST AUTO-FILL
const blogList = document.querySelector(".blog-posts-list");
function loadBlogPosts() {
  console.log("loadBlogPosts() triggered");
  const blogList = document.querySelector(".blog-posts-list");
  if (blogList) {
    console.log("blogList element:", blogList);
    const postsRef = collection(db, "posts");
    const postsQuery = query(postsRef, orderBy("date", "desc"));

    onSnapshot(postsQuery, (snapshot) => {
      console.log("Firebase returned posts:", snapshot.docs.length);

      blogList.innerHTML = "";

      snapshot.forEach((doc) => {
        console.log("Post loaded:", doc.data());

        const post = doc.data();

        const li = document.createElement("li");
        li.classList.add("blog-post-item");

        li.innerHTML = `
        <a href="blog/post.html?slug=${post.slug}">
          <figure class="blog-banner-box">
            <img src="${post.imageURL}" alt="${post.title}" loading="lazy">
          </figure>

          <div class="blog-content">
            <div class="blog-meta">
              <p class="blog-category">Blog</p>
              <span class="dot"></span>
              <time>${new Date(post.date.seconds * 1000).toDateString()}</time>
            </div>

            <h3 class="h3 blog-item-title">${post.title}</h3>

            <p class="blog-text">
              ${post.content.length > 100 ? post.content.substring(0, 100) + "..." : post.content}
            </p>
          </div>
        </a>
      `;

        blogList.appendChild(li);
      });
    });
  }
}
