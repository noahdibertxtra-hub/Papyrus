// ===== Papyrus Phase 1 Enhanced Script =====

// Load library from localStorage or initialize
let library = [];
try {
  library = JSON.parse(localStorage.getItem("library")) || [];
} catch {
  library = [];
  localStorage.setItem("library", JSON.stringify(library));
}

// ===== Book Class =====
function Book(title, author, status="want", rating=0, cover="https://via.placeholder.com/100") {
  this.title = title;
  this.author = author;
  this.status = status;
  this.rating = rating;
  this.cover = cover;
}

// ===== Elements =====
const bookForm = document.getElementById("book-form");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const searchResults = document.getElementById("search-results");
const librarySection = document.getElementById("library-section");

// ===== Helper: Show temporary messages =====
function showMessage(msg, duration=2000) {
  const messageEl = document.createElement("div");
  messageEl.textContent = msg;
  messageEl.style.position = "fixed";
  messageEl.style.top = "10px";
  messageEl.style.left = "50%";
  messageEl.style.transform = "translateX(-50%)";
  messageEl.style.backgroundColor = "#4CAF50";
  messageEl.style.color = "white";
  messageEl.style.padding = "8px 12px";
  messageEl.style.borderRadius = "5px";
  messageEl.style.zIndex = "1000";
  document.body.appendChild(messageEl);
  setTimeout(() => messageEl.remove(), duration);
}

// ===== Save library helper =====
function saveLibrary() {
  localStorage.setItem("library", JSON.stringify(library));
}

// ===== Render Library =====
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
    for (let i=1; i<=5; i++) starsHTML += `<span class="star">&#9733;</span>`;
    starsHTML += `</div>`;

    bookCard.innerHTML = `
      <img src="${book.cover}" alt="Book Cover">
      <h4>${book.title}</h4>
      <p>${book.author}</p>
      <label>Status:</label>
      <select class="status-dropdown" data-index="${index}">
        <option value="want" ${book.status==="want"?"selected":""}>Want To Read</option>
        <option value="reading" ${book.status==="reading"?"selected":""}>Reading</option>
        <option value="finished" ${book.status==="finished"?"selected":""}>Finished</option>
      </select>
      ${starsHTML}
      <button class="remove-btn">Remove</button>
    `;

    // Status change
    const statusDropdown = bookCard.querySelector(".status-dropdown");
    statusDropdown.addEventListener("change", e => {
      const idx = e.target.dataset.index;
      library[idx].status = e.target.value;
      saveLibrary();
      renderLibrary();
      showMessage("Book status updated!");
    });

    // Star ratings
    const stars = bookCard.querySelectorAll(".star");
    stars.forEach((star,i)=>{
      star.addEventListener("mouseenter",()=>stars.forEach((s,idx)=>s.style.color = idx<=i?"gold":"grey"));
      star.addEventListener("mouseleave",()=>stars.forEach((s,idx)=>s.style.color = idx<book.rating?"gold":"grey"));
      star.addEventListener("click",()=>{
        library[index].rating = i+1;
        saveLibrary();
        renderLibrary();
        showMessage(`Rated ${i+1} star${i+1>1?"s":""}`);
      });
    });
    stars.forEach((s,i)=>s.style.color=i<book.rating?"gold":"grey");

    // Remove button
    bookCard.querySelector(".remove-btn").addEventListener("click", ()=>{
      library.splice(index,1);
      saveLibrary();
      renderLibrary();
      showMessage("Book removed from library!");
    });

    // Append to correct shelf
    if (book.status==="want") wantShelf.appendChild(bookCard);
    else if (book.status==="reading") readingShelf.appendChild(bookCard);
    else if (book.status==="finished") finishedShelf.appendChild(bookCard);
  });
}

// ===== Add Book Form =====
bookForm.addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const status = document.getElementById("status").value;

  if (!title || !author) {
    showMessage("Please enter both title and author.", 2500);
    return;
  }

  if (library.some(b => b.title.toLowerCase()===title.toLowerCase() && b.author.toLowerCase()===author.toLowerCase())) {
    showMessage("Book already in library!", 2500);
    return;
  }

  const newBook = new Book(title, author, status);
  library.push(newBook);
  saveLibrary();
  renderLibrary();
  bookForm.reset();
  showMessage("Book added to library!");
});

// ===== Open Library API Search =====
async function performSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showMessage("Please enter a search term.", 2000);
    return;
  }

  searchResults.innerHTML = "<p>Searching...</p>";

  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
    const data = await res.json();

    searchResults.innerHTML = "";

    if (!data.docs || data.docs.length === 0) {
      searchResults.innerHTML = "<p>No results found.</p>";
      return;
    }

    data.docs.forEach(doc => {
      const card = document.createElement("div");
      card.className = "bookCard";

      const title = doc.title || "No Title";
      const author = doc.author_name ? doc.author_name.join(", ") : "Unknown Author";
      const cover = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "https://via.placeholder.com/100";

      card.innerHTML = `
        <img src="${cover}" alt="Book Cover">
        <h4>${title}</h4>
        <p>${author}</p>
        <button class="add-btn">Add Book</button>
      `;

      // Add book from search
      card.querySelector(".add-btn").addEventListener("click", ()=>{
        if (!library.some(b => b.title.toLowerCase()===title.toLowerCase() && b.author.toLowerCase()===author.toLowerCase())) {
          library.push(new Book(title, author, "want", 0, cover));
          saveLibrary();
          renderLibrary();
          searchResults.innerHTML = "";
          searchInput.value = "";
          showMessage("Book added to library!");
        } else {
          showMessage("Book already in library!", 2500);
        }
      });

      searchResults.appendChild(card);
    });

  } catch(err) {
    searchResults.innerHTML = "<p>Error fetching results.</p>";
    console.error(err);
  }
}

// ===== Search Button Click =====
searchButton.addEventListener("click", performSearch);
searchInput.addEventListener("keyup", e => { if(e.key==="Enter") performSearch(); });

// ===== Initial Render =====
renderLibrary();
