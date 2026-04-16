let library = JSON.parse(localStorage.getItem("library")) || [];
let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

// Book constructor
function Book(title, author, status="want", rating=0, cover="https://via.placeholder.com/100", notes="", tags=[], currentPage=0, totalPages=100) {
  this.id = crypto.randomUUID();
  this.title = title;
  this.author = author;
  this.status = status;
  this.rating = rating;
  this.cover = cover;
  this.notes = notes;
  this.tags = tags;
  this.currentPage = currentPage;
  this.totalPages = totalPages;
}

// Elements
const bookForm = document.getElementById("book-form");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const searchResults = document.getElementById("search-results");
const searchHistoryEl = document.getElementById("search-history");

const filterStatus = document.getElementById("filter-status");
const sortBy = document.getElementById("sort-by");

// Stats elements
let statsContainer = document.getElementById("library-stats");
if(!statsContainer){
  statsContainer = document.createElement("section");
  statsContainer.id = "library-stats";
  document.body.insertBefore(statsContainer, document.getElementById("library-section"));
}

// Toast notification
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}
function animateBookToShelf(imageElement) {

  const shelf = document.getElementById("wantShelf");

  if(!shelf) return;

  const imgRect = imageElement.getBoundingClientRect();
  const shelfRect = shelf.getBoundingClientRect();

  const flyingBook = imageElement.cloneNode();

  flyingBook.classList.add("fly-book");

  flyingBook.style.left = imgRect.left + "px";
  flyingBook.style.top = imgRect.top + "px";

  document.body.appendChild(flyingBook);

  setTimeout(()=>{

    const deltaX = shelfRect.left - imgRect.left;
    const deltaY = shelfRect.top - imgRect.top;

    flyingBook.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`;
    flyingBook.style.opacity = "0.3";

  },10);

  setTimeout(()=>{
    flyingBook.remove();
  },700);
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

    searchResults.innerHTML = "";
    if(!data.docs || data.docs.length===0) {
      searchResults.innerHTML="<p>No results found.</p>";
      return;
    }

    data.docs.forEach(doc=>{
      const card = document.createElement("div");
      card.className = "bookCard";

      const title = doc.title || "No Title";
      const author = doc.author_name ? doc.author_name.join(", ") : "Unknown Author";
      const cover = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "https://via.placeholder.com/100";

      const totalPages = doc.number_of_pages_median || 100;
      
      card.innerHTML = `
        <img src="${cover}" alt="Book Cover">
        <h4>${title}</h4>
        <p>${author}</p>
        <button class="add-btn">Add Book</button>
      `;

card.querySelector(".add-btn").addEventListener("click", ()=>{

  const coverImg = card.querySelector("img");

  animateBookToShelf(coverImg);

  if(!library.some(b=>b.title===title && b.author===author)){
    library.push(new Book(title, author, "want", 0, cover, "", [], 0, totalPages));
    localStorage.setItem("library",JSON.stringify(library));
    renderLibrary();

    searchResults.innerHTML="";
    searchInput.value="";
  }else{
    showToast("Book already in library");
  }

});

      searchResults.appendChild(card);
    });

  }catch(err){
    searchResults.innerHTML="<p>Error fetching results.</p>";
    console.error(err);
  }
}

// ===== Search History =====
function saveSearchHistory(query){
  if(searchHistory.includes(query)) return;
  searchHistory.unshift(query);
  if(searchHistory.length>5) searchHistory.pop();
  localStorage.setItem("searchHistory",JSON.stringify(searchHistory));
  renderSearchHistory();
}

function renderSearchHistory(){
  if(!searchHistoryEl) return;
  searchHistoryEl.innerHTML = "";
  searchHistory.forEach(q=>{
    const btn = document.createElement("button");
    btn.textContent = q;
    btn.addEventListener("click",()=>performSearch(q));
    searchHistoryEl.appendChild(btn);
  });
}

// ===== Render Library =====
function renderLibrary(){
  const wantShelf = document.getElementById("wantShelf");
  const readingShelf = document.getElementById("readingShelf");
  const finishedShelf = document.getElementById("finishedShelf");

  wantShelf.innerHTML=""; readingShelf.innerHTML=""; finishedShelf.innerHTML="";

  let filtered = library;
  if(filterStatus.value!=="all") filtered = filtered.filter(b=>b.status===filterStatus.value);
  if(sortBy.value==="title") filtered.sort((a,b)=>a.title.localeCompare(b.title));
  if(sortBy.value==="author") filtered.sort((a,b)=>a.author.localeCompare(b.author));
  if(sortBy.value==="rating") filtered.sort((a,b)=>b.rating-a.rating);

  filtered.forEach((book,index)=>{
    const card = document.createElement("div");
    card.className="bookCard";
    card.draggable=true;

    let starsHTML="<div class='stars'>";
    for(let i=1;i<=5;i++) starsHTML+=`<span class="star">&#9733;</span>`;
    starsHTML+="</div>";

    let tagsHTML = "";
    if(book.tags && book.tags.length>0) tagsHTML = "<p>Tags: "+book.tags.join(", ")+"</p>";

    const progressPercent = Math.min(100, Math.floor((book.currentPage / book.totalPages) * 100));

card.innerHTML = `
  <img src="${book.cover}">
  <h4>${book.title}</h4>
  <p>${book.author}</p>

  <select class="status-dropdown">
    <option value="want" ${book.status==="want"?"selected":""}>Want To Read</option>
    <option value="reading" ${book.status==="reading"?"selected":""}>Reading</option>
    <option value="finished" ${book.status==="finished"?"selected":""}>Finished</option>
  </select>

  <div class="progress-container">
  <div class="progress-bar" style="width: ${progressPercent}%">
    <span class="progress-text" style="color: ${progressPercent < 20 ? '#333' : '#fff'}">
  ${progressPercent}%
</span>
  </div>
</div>

<div class="progress-input">
  <input type="number" class="current-page" value="${book.currentPage}" min="0">
  /
  <input type="number" class="total-pages" value="${book.totalPages}" min="1">
  <button class="progress-save">✔</button>
</div>

  ${starsHTML}

  <button class="remove-btn">Remove</button>
`;

    // Status change
    card.querySelector(".status-dropdown").addEventListener("change",e=>{
      library[index].status=e.target.value;
      localStorage.setItem("library",JSON.stringify(library));
      renderLibrary();
    });

// ===== Progress Update (Manual Save Button) =====
const currentInput = card.querySelector(".current-page");
const totalInput = card.querySelector(".total-pages");
const saveBtn = card.querySelector(".progress-save");

saveBtn.addEventListener("click", () => {
  book.currentPage = parseInt(currentInput.value) || 0;
  book.totalPages = parseInt(totalInput.value) || 1;

  localStorage.setItem("library", JSON.stringify(library));
  renderLibrary();
});

    // Stars
    const stars = card.querySelectorAll(".star");
    stars.forEach((s,i)=>{
      s.addEventListener("mouseenter",()=>stars.forEach((st,j)=>st.style.color=j<=i?"gold":"grey"));
      s.addEventListener("mouseleave",()=>stars.forEach((st,j)=>st.style.color=j<book.rating?"gold":"grey"));
      s.addEventListener("click",()=>{ 
        library[index].rating=i+1; 
        localStorage.setItem("library",JSON.stringify(library)); 
        renderLibrary(); 
      });
      s.style.color=i<book.rating?"gold":"grey";
    });

    // Remove
    card.querySelector(".remove-btn").addEventListener("click",()=>{
      library.splice(index,1);
      localStorage.setItem("library",JSON.stringify(library));
      renderLibrary();
    });

    if(book.status==="want") wantShelf.appendChild(card);
    if(book.status==="reading") readingShelf.appendChild(card);
    if(book.status==="finished") finishedShelf.appendChild(card);
  });

  // Drag & Drop
  const shelves = document.querySelectorAll(".drop-zone");
  shelves.forEach(shelf=>{
    shelf.addEventListener("dragover", e=>{ e.preventDefault(); shelf.classList.add("drag-over"); });
    shelf.addEventListener("dragleave", ()=>shelf.classList.remove("drag-over"));
    shelf.addEventListener("drop", e=>{
      const bookTitle = e.dataTransfer.getData("text/plain");
      const book = library.find(b=>b.title===bookTitle);
      if(book){
        book.status = shelf.parentElement.dataset.status;
        localStorage.setItem("library",JSON.stringify(library));
        renderLibrary();
      }
      shelf.classList.remove("drag-over");
    });
  });

  // Attach dragstart to cards
  document.querySelectorAll(".bookCard").forEach(card=>{
    card.addEventListener("dragstart",e=>{
      e.dataTransfer.setData("text/plain", card.querySelector("h4").textContent);
    });
  });

  renderStats();
}

// ===== Library Stats =====
function renderStats(){
  const total = library.length;
  const want = library.filter(b=>b.status==="want").length;
  const reading = library.filter(b=>b.status==="reading").length;
  const finished = library.filter(b=>b.status==="finished").length;
  const ratedBooks = library.filter(b=>b.rating>0);
  const avgRating = ratedBooks.length>0 ? (ratedBooks.reduce((a,b)=>a+b.rating,0)/ratedBooks.length).toFixed(1) : 0;

  statsContainer.innerHTML = `
    <h3>Library Stats</h3>
    <p>Total Books: ${total}</p>
    <p>Want To Read: ${want}</p>
    <p>Reading: ${reading}</p>
    <p>Finished: ${finished}</p>
    <p>Average Rating: ${avgRating}</p>
    <button id="export-library">Export Library</button>
    <input type="file" id="import-library" accept="application/json">
  `;

  document.getElementById("export-library").addEventListener("click",()=>{
    const dataStr = JSON.stringify(library, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "papyrus-library.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-library").addEventListener("change",e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = e=>{
      try{
        library = JSON.parse(e.target.result);
        localStorage.setItem("library", JSON.stringify(library));
        renderLibrary();
      }catch(err){ alert("Invalid file format"); }
    };
    reader.readAsText(file);
  });
}

// ===== Events =====
searchButton.addEventListener("click",()=>performSearch());
searchInput.addEventListener("keyup",e=>{if(e.key==="Enter") performSearch();});
filterStatus.addEventListener("change",renderLibrary);
sortBy.addEventListener("change",renderLibrary);

const darkToggle = document.getElementById("dark-mode-toggle");

// Load saved preference
if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
  darkToggle.textContent = "☀️";
}

// Toggle on click
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("darkMode", "enabled");
    darkToggle.textContent = "☀️";
  } else {
    localStorage.setItem("darkMode", "disabled");
    darkToggle.textContent = "🌙";
  }
});

function calculateXP() {
  const finished = library.filter(b => b.status === "finished").length;
  return finished * 10;
}

// ===== Init =====
renderSearchHistory();
renderLibrary();
