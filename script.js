// --------------------
// Initialize Library
// --------------------
let library = JSON.parse(localStorage.getItem("library")) || [];
renderLibrary();

// --------------------
// Search Books (Open Library API)
// --------------------
async function searchBooks() {
  const query = document.getElementById("searchInput").value;
  if (!query) return alert("Enter a search term!");

  const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
  const data = await res.json();

  displayResults(data.docs);
}

// --------------------
// Display Search Results
// --------------------
function displayResults(books) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  books.forEach(book => {
    const title = book.title;
    const author = book.author_name ? book.author_name[0] : "Unknown";
    const cover = book.cover_i 
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` 
      : "https://via.placeholder.com/80x120?text=No+Cover";

    const bookCard = document.createElement("div");
    bookCard.className = "bookCard";

    bookCard.innerHTML = `
      <img src="${cover}">
      <h4>${title}</h4>
      <p>${author}</p>
      <button onclick="addBook('${title}', '${author}', '${cover}')">Add Book</button>
    `;

    resultsDiv.appendChild(bookCard);
  });
}

// --------------------
// Add Book to Library
// --------------------
function addBook(title, author, cover) {
  const status = document.getElementById("statusSelect").value;

  const book = {
    title: title,
    author: author,
    cover: cover,
    rating: 0,
    status: status
  };

  library.push(book);
  localStorage.setItem("library", JSON.stringify(library));
  renderLibrary();
}

// --------------------
// Render Library
// --------------------
function renderLibrary() {
  const wantShelf = document.getElementById("wantShelf");
  const readingShelf = document.getElementById("readingShelf");
  const finishedShelf = document.getElementById("finishedShelf");

  wantShelf.innerHTML = "";
  readingShelf.innerHTML = "";
  finishedShelf.innerHTML = "";

  library.forEach((book, index) => {
    const bookCard = document.createElement("div");
    bookCard.className = "bookCard";

    // Stars
    let starsHTML = `<div class="stars">`;
    for (let i = 1; i <= 5; i++) {
      starsHTML += `<span class="star" onclick="rateBook(${index}, ${i})">&#9733;</span>`;
    }
    starsHTML += `</div>`;

    bookCard.innerHTML = `
      <img src="${book.cover}">
      <h4>${book.title}</h4>
      <p>${book.author}</p>
      ${starsHTML}
      <button class="remove-btn" onclick="removeBook(${index})">Remove</button>
    `;

    if (book.status === "want") wantShelf.appendChild(bookCard);
    else if (book.status === "reading") readingShelf.appendChild(bookCard);
    else if (book.status === "finished") finishedShelf.appendChild(bookCard);
  });
}

// --------------------
// Rate Book
// --------------------
function rateBook(index, rating) {
  library[index].rating = rating;
  localStorage.setItem("library", JSON.stringify(library));
  renderLibrary();
}

// --------------------
// Remove Book
// --------------------
function removeBook(index) {
  library.splice(index, 1);
  localStorage.setItem("library", JSON.stringify(library));
  renderLibrary();
}
