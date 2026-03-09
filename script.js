// ======= Papyrus Library =======

// Load library from localStorage or start with empty array
let library = JSON.parse(localStorage.getItem("library")) || [];

// ======= Book Constructor =======
function Book(title, author, status = "want", rating = 0) {
  this.title = title;
  this.author = author;
  this.status = status;
  this.rating = rating;
  this.cover = "https://via.placeholder.com/100"; // default placeholder
}

// ======= Add Book =======
const bookForm = document.getElementById("book-form");
const searchInput = document.getElementById("search-input");

bookForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const status = document.getElementById("status").value;

  if (!title || !author) return;

  // prevent duplicates
  if (library.some(b => b.title === title && b.author === author)) {
    alert("Book already in your library!");
    return;
  }

  const newBook = new Book(title, author, status);
  library.push(newBook);
  localStorage.setItem("library", JSON.stringify(library));

  // Collapse search after adding
  searchInput.value = "";

  renderLibrary(); // show full library
  bookForm.reset();
});

// ======= Search Books =======
searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();

  if (!term) {
    renderLibrary(); // show full library
  } else {
    const filtered = library.filter(book =>
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term)
    );
    renderLibrary(filtered);
  }
});

// ======= Render Library =======
function renderLibrary(booksToRender = library) {
  const wantShelf = document.getElementById("wantShelf");
  const readingShelf = document.getElementById("readingShelf");
  const finishedShelf = document.getElementById("finishedShelf");

  // Clear shelves
  wantShelf.innerHTML = "";
  readingShelf.innerHTML = "";
  finishedShelf.innerHTML = "";

  booksToRender.forEach((book, index) => {
    const bookCard = document.createElement("div");
    bookCard.className = "bookCard";

    // Star HTML
    let starsHTML = `<div class="stars">`;
    for (let i = 1; i <= 5; i++) {
      starsHTML += `<span class="star">&#9733;</span>`;
    }
    starsHTML += `</div>`;

    // Book card content
    bookCard.innerHTML = `
      <img src="${book.cover}" alt="Book Cover">
      <h4>${book.title}</h4>
      <p>${book.author}</p>

      <label>Status:</label>
      <select class="status-dropdown" data-index="${index}">
        <option value="want" ${book.status === "want" ? "selected" : ""}>Want to Read</option>
        <option value="reading" ${book.status === "reading" ? "selected" : ""}>Currently Reading</option>
        <option value="finished" ${book.status === "finished" ? "selected" : ""}>Finished</option>
      </select>

      ${starsHTML}
      <button class="remove-btn">Remove</button>
    `;

    // ======= Status Change Logic =======
    const dropdown = bookCard.querySelector(
