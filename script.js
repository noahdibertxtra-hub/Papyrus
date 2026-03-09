// ======= Papyrus Library =======

// Load library from localStorage or start with empty array
let library = JSON.parse(localStorage.getItem("library")) || [];

// ======= Book Constructor =======
function Book(title, author, status = "Unread", rating = 0) {
  this.title = title;
  this.author = author;
  this.status = status;
  this.rating = rating;
}

// ======= Add Book =======
const bookForm = document.getElementById("book-form");

bookForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const status = document.getElementById("status").value;

  // Prevent duplicates
  if (library.some(b => b.title === title && b.author === author)) {
    alert("Book already in your library!");
    return;
  }

  const newBook = new Book(title, author, status);
  library.push(newBook);
  localStorage.setItem("library", JSON.stringify(library));
  renderLibrary();
  bookForm.reset();
});

// ======= Search =======
const searchInput = document.getElementById("search-input");

searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    renderLibrary();
  } else {
    const filtered = library.filter(book =>
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term)
    );
    renderLibrary(filtered);
  }
});

// ======= Render Library =======
function renderLibrary(books = library) {
  const wantShelf = document.getElementById("wantShelf");
  const readingShelf = document.getElementById("readingShelf");
  const finishedShelf = document.getElementById("finishedShelf");

  // Clear all shelves
  wantShelf.innerHTML = "";
  readingShelf.innerHTML = "";
  finishedShelf.innerHTML = "";

  books.forEach((book, index) => {
    const bookCard = document.createElement("div");
    bookCard.className = "bookCard";

    // Star HTML
    let starsHTML = `<div class="stars">`;
    for (let i = 1; i <= 5; i++) {
      starsHTML += `<span class="star">&#9733;</span>`;
    }
    starsHTML += `</div>`;

    // Book card innerHTML with status dropdown
    bookCard.innerHTML = `
      <img src="${book.cover || "https://via.placeholder.com/100"}" alt="Book Cover">
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
    const dropdown = bookCard.querySelector(".status-dropdown");
    dropdown.addEventListener("change", (event) => {
      const bookIndex = event.target.dataset.index;
      library[bookIndex].status = event.target.value;
      localStorage.setItem("library", JSON.stringify(library));
      renderLibrary();
    });

    // ======= Star Rating Logic =======
    const stars = bookCard.querySelectorAll(".star");

    stars.forEach((star, i) => {
      // Hover effect
      star.addEventListener("mouseenter", () => {
        stars.forEach((s, idx) => {
          s.style.color = idx <= i ? "gold" : "grey";
        });
      });

      star.addEventListener("mouseleave", () => {
        stars.forEach((s, idx) => {
          s.style.color = idx < book.rating ? "gold" : "grey";
        });
      });

      // Click to set rating
      star.addEventListener("click", () => {
        library[index].rating = i + 1;
        localStorage.setItem("library", JSON.stringify(library));
        renderLibrary();
      });
    });

    // Set initial star colors
    stars.forEach((s, idx) => {
      s.style.color = idx < book.rating ? "gold" : "grey";
    });

    // ======= Remove Button =======
    const removeBtn = bookCard.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => {
      library.splice(index, 1);
      localStorage.setItem("library", JSON.stringify(
