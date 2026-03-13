let library = JSON.parse(localStorage.getItem("library")) || [];
let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

// Book constructor
function Book(title, author, status="want", rating=0, cover="https://via.placeholder.com/100", notes="", tags=[]) {
  this.title = title;
  this.author = author;
  this.status = status;
  this.rating = rating;
  this.cover = cover;
  this.notes = notes;
  this.tags = tags;
}

// Elements
const bookForm = document.getElementById("book-form");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const searchResults = document.getElementById("search-results");
const searchHistoryEl = document.getElementById("search-history");

const filterStatus = document.getElementById("filter-status");
const sortBy = document.getElementById("sort-by");

// Modal elements
const modal = document.getElementById("book-modal");
const modalCover = document.getElementById("modal-cover");
const modalTitle = document.getElementById("modal-title");
const modalAuthor = document.getElementById("modal-author");
const modalPublish = document.getElementById("modal-publish");
const modalDesc = document.getElementById("modal-description");
const closeBtn = document.querySelector(".close-btn");

// Stats elements
let statsContainer = document.getElementById("library-stats");
if(!statsContainer){
  statsContainer = document.createElement("section");
  statsContainer.id = "library-stats";
  document.body.insertBefore(statsContainer, document.getElementById("library-section"));
}

// ===== Book Form =====
bookForm.addEventListener("submit", e=>{
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const status = document.getElementById("status").value;
  let tagsInput = document.getElementById("tags");
  let tags = tagsInput ? tagsInput.value.split(",").map(t=>t.trim()).filter(t=>t) : [];

  if(!title || !author) return;
  if(library.some(b=>b.title.toLowerCase()===title.toLowerCase() && b.author.toLowerCase()===author.toLowerCase())){
    alert("Book already in library!");
    return;
  }
  library.push(new Book(title, author, status, 0, "https://via.placeholder.com/100", "", tags));
  localStorage.setItem("library", JSON.stringify(library));
  bookForm.reset();
  renderLibrary();
});

// ===== Open Library Search =====
async function performSearch(query){
  query = query || searchInput.value.trim();
  if(!query) return alert("Enter a search term");

  searchResults.innerHTML = "<p>Searching...</p>";
  saveSearchHistory(query);

  try{
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
    const data = await res.json();

    sea
