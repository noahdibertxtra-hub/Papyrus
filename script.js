 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/script.js b/script.js
index 9ffe9ea1dde2eea1868258928e9ad2b8569ae748..146fd9ec6d148f8b8b26128dfe1f0b95b6f98d61 100644
--- a/script.js
+++ b/script.js
@@ -1,160 +1,402 @@
-let library = JSON.parse(localStorage.getItem("library")) || [];
+function createBookId() {
+  return `book-${Date.now()}-${Math.random().toString(16).slice(2)}`;
+}
+
+function normalizeText(value) {
+  return value.trim().toLowerCase().replace(/\s+/g, " ");
+}
+
+function buildBookKey(title, author) {
+  return `${normalizeText(title)}::${normalizeText(author)}`;
+}
+
+function loadLibrary() {
+  const rawLibrary = JSON.parse(localStorage.getItem("library")) || [];
+
+  let needsMigration = false;
+  const hydratedLibrary = rawLibrary.map((book) => {
+    const hydratedBook = {
+      id: book.id || createBookId(),
+      title: (book.title || "").trim(),
+      author: (book.author || "Unknown Author").trim(),
+      status: book.status || "want",
+      rating: Number.isInteger(book.rating) ? book.rating : 0,
+      cover: book.cover || "https://via.placeholder.com/100",
+      notes: typeof book.notes === "string" ? book.notes : "",
+      createdAt: typeof book.createdAt === "number" ? book.createdAt : Date.now()
+    };
+
+    if (!book.id || typeof book.notes !== "string" || typeof book.createdAt !== "number") {
+      needsMigration = true;
+    }
+
+    return hydratedBook;
+  });
+
+  if (needsMigration) {
+    localStorage.setItem("library", JSON.stringify(hydratedLibrary));
+  }
+
+  return hydratedLibrary;
+}
 
-function Book(title, author, status="want", rating=0, cover="https://via.placeholder.com/100") {
-  this.title = title;
-  this.author = author;
+function saveLibrary() {
+  localStorage.setItem("library", JSON.stringify(library));
+}
+
+function isDuplicateBook(title, author, ignoredBookId = null) {
+  const candidateKey = buildBookKey(title, author);
+
+  return library.some((book) => {
+    if (ignoredBookId && book.id === ignoredBookId) {
+      return false;
+    }
+
+    return buildBookKey(book.title, book.author) === candidateKey;
+  });
+}
+
+let library = loadLibrary();
+
+function Book(title, author, status = "want", rating = 0, cover = "https://via.placeholder.com/100") {
+  this.id = createBookId();
+  this.title = title.trim();
+  this.author = author.trim();
   this.status = status;
   this.rating = rating;
   this.cover = cover;
+  this.notes = "";
+  this.createdAt = Date.now();
 }
 
-// Elements
 const bookForm = document.getElementById("book-form");
 const searchInput = document.getElementById("search-input");
 const searchButton = document.getElementById("search-button");
 const searchResults = document.getElementById("search-results");
 
-// Add book form
-bookForm.addEventListener("submit", e => {
+const libraryFilterInput = document.getElementById("library-filter-input");
+const statusFilter = document.getElementById("status-filter");
+const sortSelect = document.getElementById("sort-select");
+
+function applyLibraryView() {
+  const searchTerm = normalizeText(libraryFilterInput.value || "");
+  const selectedStatus = statusFilter.value;
+  const sortMode = sortSelect.value;
+
+  let books = library.filter((book) => {
+    const statusMatch = selectedStatus === "all" || book.status === selectedStatus;
+    const termMatch = !searchTerm
+      || normalizeText(book.title).includes(searchTerm)
+      || normalizeText(book.author).includes(searchTerm)
+      || normalizeText(book.notes).includes(searchTerm);
+
+    return statusMatch && termMatch;
+  });
+
+  books = books.sort((a, b) => {
+    if (sortMode === "title-asc") return a.title.localeCompare(b.title);
+    if (sortMode === "author-asc") return a.author.localeCompare(b.author);
+    if (sortMode === "rating-desc") return b.rating - a.rating;
+    return b.createdAt - a.createdAt;
+  });
+
+  renderLibrary(books);
+}
+
+bookForm.addEventListener("submit", (e) => {
   e.preventDefault();
   const title = document.getElementById("title").value.trim();
   const author = document.getElementById("author").value.trim();
   const status = document.getElementById("status").value;
 
   if (!title || !author) return;
 
-  if (library.some(b => b.title===title && b.author===author)) {
+  if (isDuplicateBook(title, author)) {
     alert("Book already in library!");
     return;
   }
 
-  const newBook = new Book(title, author, status);
-  library.push(newBook);
-  localStorage.setItem("library", JSON.stringify(library));
+  library.push(new Book(title, author, status));
+  saveLibrary();
   searchInput.value = "";
   searchResults.innerHTML = "";
   bookForm.reset();
-  renderLibrary();
+  applyLibraryView();
 });
 
-// ===== Open Library API Search =====
+function clearSearchResults() {
+  searchResults.innerHTML = "";
+}
+
+function createSearchResultCard(doc) {
+  const card = document.createElement("div");
+  card.className = "bookCard";
+
+  const title = (doc.title || "No Title").trim();
+  const author = doc.author_name ? doc.author_name.join(", ").trim() : "Unknown Author";
+  const cover = doc.cover_i
+    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
+    : "https://via.placeholder.com/100";
+
+  const image = document.createElement("img");
+  image.src = cover;
+  image.alt = "Book Cover";
+
+  const heading = document.createElement("h4");
+  heading.textContent = title;
+
+  const authorText = document.createElement("p");
+  authorText.textContent = author;
+
+  const addButton = document.createElement("button");
+  addButton.className = "edit-btn";
+  addButton.type = "button";
+  addButton.textContent = "Add Book";
+
+  addButton.addEventListener("click", () => {
+    if (!isDuplicateBook(title, author)) {
+      library.push(new Book(title, author, "want", 0, cover));
+      saveLibrary();
+      clearSearchResults();
+      searchInput.value = "";
+      applyLibraryView();
+    } else {
+      alert("Book already in library!");
+    }
+  });
+
+  card.append(image, heading, authorText, addButton);
+  return card;
+}
+
 async function performSearch() {
   const query = searchInput.value.trim();
   if (!query) return;
   searchResults.innerHTML = "<p>Searching...</p>";
 
   try {
     const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
-    const data = await res.json();
 
-    searchResults.innerHTML = "";
+    if (!res.ok) {
+      throw new Error(`Search failed with status ${res.status}`);
+    }
+
+    const data = await res.json();
+    clearSearchResults();
 
-    if (data.docs.length === 0) {
+    if (!data.docs || data.docs.length === 0) {
       searchResults.innerHTML = "<p>No results found.</p>";
       return;
     }
 
     data.docs.forEach((doc) => {
-      const card = document.createElement("div");
-      card.className = "bookCard";
-
-      const title = doc.title || "No Title";
-      const author = doc.author_name ? doc.author_name.join(", ") : "Unknown Author";
-      const cover = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "https://via.placeholder.com/100";
-
-      card.innerHTML = `
-        <img src="${cover}" alt="Book Cover">
-        <h4>${title}</h4>
-        <p>${author}</p>
-        <button class="add-btn">Add Book</button>
-      `;
-
-      card.querySelector(".add-btn").addEventListener("click", () => {
-        if (!library.some(b => b.title===title && b.author===author)) {
-          library.push(new Book(title, author, "want", 0, cover));
-          localStorage.setItem("library", JSON.stringify(library));
-          searchResults.innerHTML = ""; // collapse results
-          searchInput.value = "";
-          renderLibrary();
-        } else {
-          alert("Book already in library!");
-        }
-      });
-
-      searchResults.appendChild(card);
+      searchResults.appendChild(createSearchResultCard(doc));
     });
-
-  } catch(err) {
+  } catch (err) {
     searchResults.innerHTML = "<p>Error fetching results.</p>";
     console.error(err);
   }
 }
 
-// Search button click
 searchButton.addEventListener("click", performSearch);
+searchInput.addEventListener("keydown", (event) => {
+  if (event.key === "Enter") {
+    event.preventDefault();
+    performSearch();
+  }
+});
+
+libraryFilterInput.addEventListener("input", applyLibraryView);
+statusFilter.addEventListener("change", applyLibraryView);
+sortSelect.addEventListener("change", applyLibraryView);
+
+function createLibraryCard(book) {
+  const bookCard = document.createElement("div");
+  bookCard.className = "bookCard";
+  bookCard.dataset.bookId = book.id;
+
+  const image = document.createElement("img");
+  image.src = book.cover;
+  image.alt = "Book Cover";
+
+  const title = document.createElement("h4");
+  title.textContent = book.title;
+
+  const author = document.createElement("p");
+  author.textContent = book.author;
+
+  const statusLabel = document.createElement("label");
+  statusLabel.textContent = "Status:";
+
+  const statusDropdown = document.createElement("select");
+  statusDropdown.className = "status-dropdown";
+  [
+    ["want", "Want To Read"],
+    ["reading", "Reading"],
+    ["finished", "Finished"]
+  ].forEach(([value, label]) => {
+    const option = document.createElement("option");
+    option.value = value;
+    option.textContent = label;
+    option.selected = book.status === value;
+    statusDropdown.appendChild(option);
+  });
+
+  statusDropdown.addEventListener("change", (event) => {
+    const targetBook = library.find((item) => item.id === book.id);
+    if (!targetBook) return;
+
+    targetBook.status = event.target.value;
+    saveLibrary();
+    applyLibraryView();
+  });
+
+  const starsContainer = document.createElement("div");
+  starsContainer.className = "stars";
+  const stars = [];
+
+  for (let i = 1; i <= 5; i += 1) {
+    const star = document.createElement("span");
+    star.className = "star";
+    star.innerHTML = "&#9733;";
+
+    star.addEventListener("mouseenter", () => {
+      stars.forEach((s, idx) => {
+        s.style.color = idx < i ? "gold" : "grey";
+      });
+    });
+
+    star.addEventListener("mouseleave", () => {
+      stars.forEach((s, idx) => {
+        s.style.color = idx < book.rating ? "gold" : "grey";
+      });
+    });
+
+    star.addEventListener("click", () => {
+      const targetBook = library.find((item) => item.id === book.id);
+      if (!targetBook) return;
+
+      targetBook.rating = i;
+      saveLibrary();
+      applyLibraryView();
+    });
+
+    stars.push(star);
+    starsContainer.appendChild(star);
+  }
+
+  stars.forEach((star, index) => {
+    star.style.color = index < book.rating ? "gold" : "grey";
+  });
+
+  const editButton = document.createElement("button");
+  editButton.className = "edit-btn";
+  editButton.type = "button";
+  editButton.textContent = "Edit";
+  editButton.addEventListener("click", () => {
+    const nextTitle = prompt("Edit title:", book.title);
+    if (nextTitle === null) return;
+
+    const nextAuthor = prompt("Edit author:", book.author);
+    if (nextAuthor === null) return;
 
-// ===== Render Library =====
-function renderLibrary(booksToRender=library) {
+    const cleanTitle = nextTitle.trim();
+    const cleanAuthor = nextAuthor.trim();
+
+    if (!cleanTitle || !cleanAuthor) {
+      alert("Title and author are required.");
+      return;
+    }
+
+    if (isDuplicateBook(cleanTitle, cleanAuthor, book.id)) {
+      alert("Another book with this title and author already exists.");
+      return;
+    }
+
+    const targetBook = library.find((item) => item.id === book.id);
+    if (!targetBook) return;
+
+    targetBook.title = cleanTitle;
+    targetBook.author = cleanAuthor;
+    saveLibrary();
+    applyLibraryView();
+  });
+
+  const reviewLabel = document.createElement("label");
+  reviewLabel.className = "review-label";
+  reviewLabel.textContent = "Review:";
+
+  const notes = document.createElement("textarea");
+  notes.className = "book-notes";
+  notes.placeholder = "Write your review...";
+  notes.maxLength = 500;
+  notes.value = book.notes || "";
+
+  const reviewCount = document.createElement("small");
+  reviewCount.className = "review-count";
+  reviewCount.textContent = `${notes.value.length}/500`;
+
+  notes.addEventListener("input", () => {
+    reviewCount.textContent = `${notes.value.length}/500`;
+  });
+
+  const saveNotesButton = document.createElement("button");
+  saveNotesButton.className = "save-notes-btn";
+  saveNotesButton.type = "button";
+  saveNotesButton.textContent = "Save Review";
+  saveNotesButton.addEventListener("click", () => {
+    const targetBook = library.find((item) => item.id === book.id);
+    if (!targetBook) return;
+
+    targetBook.notes = notes.value.trim();
+    saveLibrary();
+    applyLibraryView();
+  });
+
+  const removeButton = document.createElement("button");
+  removeButton.className = "remove-btn";
+  removeButton.type = "button";
+  removeButton.textContent = "Remove";
+  removeButton.addEventListener("click", () => {
+    library = library.filter((item) => item.id !== book.id);
+    saveLibrary();
+    applyLibraryView();
+  });
+
+  bookCard.append(
+    image,
+    title,
+    author,
+    statusLabel,
+    statusDropdown,
+    starsContainer,
+    editButton,
+    reviewLabel,
+    notes,
+    reviewCount,
+    saveNotesButton,
+    removeButton
+  );
+
+  return bookCard;
+}
+
+function renderLibrary(booksToRender = library) {
   const wantShelf = document.getElementById("wantShelf");
   const readingShelf = document.getElementById("readingShelf");
   const finishedShelf = document.getElementById("finishedShelf");
 
   wantShelf.innerHTML = "";
   readingShelf.innerHTML = "";
   finishedShelf.innerHTML = "";
 
-  booksToRender.forEach((book, index) => {
-    const bookCard = document.createElement("div");
-    bookCard.className = "bookCard";
-
-    let starsHTML = `<div class="stars">`;
-    for (let i=1;i<=5;i++) starsHTML += `<span class="star">&#9733;</span>`;
-    starsHTML += `</div>`;
-
-    bookCard.innerHTML = `
-      <img src="${book.cover}" alt="Book Cover">
-      <h4>${book.title}</h4>
-      <p>${book.author}</p>
-      <label>Status:</label>
-      <select class="status-dropdown" data-index="${index}">
-        <option value="want" ${book.status==="want"?"selected":""}>Want To Read</option>
-        <option value="reading" ${book.status==="reading"?"selected":""}>Reading</option>
-        <option value="finished" ${book.status==="finished"?"selected":""}>Finished</option>
-      </select>
-      ${starsHTML}
-      <button class="remove-btn">Remove</button>
-    `;
-
-    // Status change
-    bookCard.querySelector(".status-dropdown").addEventListener("change", e=>{
-      const idx = e.target.dataset.index;
-      library[idx].status = e.target.value;
-      localStorage.setItem("library", JSON.stringify(library));
-      renderLibrary();
-    });
-
-    // Star ratings
-    const stars = bookCard.querySelectorAll(".star");
-    stars.forEach((star,i)=>{
-      star.addEventListener("mouseenter",()=>stars.forEach((s,idx)=>s.style.color = idx<=i?"gold":"grey"));
-      star.addEventListener("mouseleave",()=>stars.forEach((s,idx)=>s.style.color = idx<book.rating?"gold":"grey"));
-      star.addEventListener("click",()=>{ library[index].rating=i+1; localStorage.setItem("library", JSON.stringify(library)); renderLibrary(); });
-    });
-    stars.forEach((s,i)=>s.style.color=i<book.rating?"gold":"grey");
-
-    // Remove button
-    bookCard.querySelector(".remove-btn").addEventListener("click", ()=>{
-      library.splice(index,1);
-      localStorage.setItem("library", JSON.stringify(library));
-      renderLibrary();
-    });
+  booksToRender.forEach((book) => {
+    const bookCard = createLibraryCard(book);
 
-    // Append to correct shelf
-    if (book.status==="want") wantShelf.appendChild(bookCard);
-    else if (book.status==="reading") readingShelf.appendChild(bookCard);
-    else if (book.status==="finished") finishedShelf.appendChild(bookCard);
+    if (book.status === "want") wantShelf.appendChild(bookCard);
+    else if (book.status === "reading") readingShelf.appendChild(bookCard);
+    else if (book.status === "finished") finishedShelf.appendChild(bookCard);
   });
 }
 
-// Initial render
-renderLibrary();
+applyLibraryView();
 
EOF
)
