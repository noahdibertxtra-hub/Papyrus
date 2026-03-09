// ======= Papyrus Library =======
let library = JSON.parse(localStorage.getItem("library")) || [];

// ======= Book Constructor =======
function Book(title, author, status = "want", rating = 0) {
  this.title = title;
  this.author = author;
  this.status = status;
  this.rating = rating;
  this.cover = "https://via.placeholder.com/100"; // default cover
}

// ======= Add Book =======
const bookForm = document.getElementById("book-form");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");

bookForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const status = document.getElementById("status").value;

  if (!title || !author) return;

  if (library.some(b => b.title === title && b.author === author)) {
    alert("Book already in your library!");
    return;
  }

  const newBook = new Book(title, author, status);
  library.push(newBook);
  localStorage.setItem("library", JSON.stringify(library));

  // Collapse search after adding
  searchInput.value = "";

  renderLibrary();
  bookForm.reset();
});

// ======= Search Function =======
function performSearch() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) renderLibrary();
  else {
    const filtered = library.filter(book =>
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term)
    );
    renderLibrary(filtered);
  }
}

// Trigger search on search button click
searchButton.addEventListener("click", performSearch);

// Trigger search on Enter key
searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") performSearch();
});

// ======= Render Library =======
function renderLibrary(booksToRender = library) {
  const wantShelf = document.getElementById("wantShelf");
  const readingShelf = document.getElementById("readingShelf");
  const finishedShelf = document.getElementById("finishedShelf");

  wantShelf.innerHTML = "";
  readingShelf.innerHTML = "";
  finishedShelf.innerHTML = "";

  booksToRender.forEach((book, index) => {
    const bookCard = document.createElement("div");
    bookCard.className = "bookCard";

    // Star HTML
    let starsHTML = `<div class="stars">`;
    for (let i = 1; i <= 5; i++) starsHTML += `<span class="star">&#9733;</span>`;
    starsHTML += `</div>`;

    bookCard.innerHTML = `
      <img src="${book.cover}" alt="Book Cover">
      <h4>${book.title}</h4>
      <p>${book.author}</p>

      <label>Status:</label>
      <select class="status-dropdown" data-index="${index}">
        <option value="want" ${book.status === "want" ? "selected" : ""}>Want To Read</option>
        <option value="reading" ${book.status === "reading" ? "selected" : ""}>Reading</option>
        <option value="finished" ${book.status === "finished" ? "selected" : ""}>Finished</option>
      </select>

      ${starsHTML}
      <button class="remove-btn">Remove</button>
    `;

    // Status Dropdown
    const dropdown = bookCard.querySelector(".status-dropdown");
    dropdown.addEventListener("change", (event) => {
      const bookIndex = event.target.dataset.index;
      library[bookIndex].status = event.target.value;
      localStorage.setItem("library", JSON.stringify(library));
      renderLibrary();
    });

    // Star Ratings
    const stars = bookCard.querySelectorAll(".star");
    stars.forEach((star, i) => {
      star.addEventListener("mouseenter", () => {
        stars.forEach((s, idx) => (s.style.color = idx <= i ? "gold" : "grey"));
      });
      star.addEventListener("mouseleave", () => {
        stars.forEach((s, idx) => (s.style.color = idx < book.rating ? "gold" : "grey"));
      });
      star.addEventListener("click", () => {
        library[index].rating = i + 1;
        localStorage.setItem("library", JSON.stringify(library));
        renderLibrary();
      });
    });
    stars.forEach((s, idx) => (s.style.color = idx < book.rating ? "gold" : "grey"));

    // Remove Button
    const removeBtn = bookCard.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => {
      library.splice(index, 1);
      localStorage.setItem("library", JSON.stringify(library));
      renderLibrary();
    });

    // Append to Correct Shelf
    if (book.status === "want") wantShelf.appendChild(bookCard);
    else if (book.status === "reading") readingShelf.appendChild(bookCard);
    else if (book.status === "finished") finishedShelf.appendChild(bookCard);
  });
}

// ======= Initial Render =======
renderLibrary();
