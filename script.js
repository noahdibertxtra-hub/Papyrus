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

function displayResults(books) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  books.forEach((book) => {
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
      <button class="add-btn">Add Book</button>
    `;

    resultsDiv.appendChild(bookCard);

    // Add click listener safely
    const addBtn = bookCard.querySelector(".add-btn");
    addBtn.addEventListener("click", () => {
      addBook(title, author, cover);
    });
  });
}

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

  // Collapse search results
  document.getElementById("results").innerHTML = "";

  renderLibrary();
}

function renderLibrary() {
  const wantShelf = document.getElementById("wantShelf");
  const readingShelf = document.getElementById("readingShelf");
  const finishedShelf = document.getElementById("finishedShelf");

  // Clear all shelves
  wantShelf.innerHTML = "";
  readingShelf.innerHTML = "";
  finishedShelf.innerHTML = "";

  library.forEach((book, index) => {
    const bookCard = document.createElement("div");
    bookCard.className = "bookCard";

    // Build stars
    let starsHTML = `<div class="stars">`;
    for (let i = 1; i <= 5; i++) {
      starsHTML += `<span class="star">&#9733;</span>`;
    }
    starsHTML += `</div>`;

    // Set innerHTML for book
    bookCard.innerHTML = `
      <img src="${book.cover}">
      <h4>${book.title}</h4>
      <p>${book.author}</p>
      ${starsHTML}
      <button class="remove-btn">Remove</button>
    `;

    // Select stars in this card
    const stars = bookCard.querySelectorAll(".star");

    // Add hover + click behavior
    stars.forEach((star, i) => {

      // Hover: temporarily show highlight up to this star
      star.addEventListener("mouseenter", () => {
        stars.forEach((s, idx) => {
          s.style.color = idx <= i ? "gold" : "grey";
        });
      });

      // Hover out: restore saved rating
      star.addEventListener("mouseleave", () => {
        stars.forEach((s, idx) => {
          s.style.color = idx < book.rating ? "gold" : "grey";
        });
      });

      // Click: set rating
      star.addEventListener("click", () => {
        library[index].rating = i + 1;
        localStorage.setItem("library", JSON.stringify(library));
        renderLibrary(); // Re-render to update permanent color
      });

    });

    // Initialize star colors based on current rating
    stars.forEach((s, idx) => {
      s.style.color = idx < book.rating ? "gold" : "grey";
    });

    // Remove button functionality
    const removeBtn = bookCard.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => {
      library.splice(index, 1);
      localStorage.setItem("library", JSON.stringify(library));
      renderLibrary();
    });

    // Append to correct shelf
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
