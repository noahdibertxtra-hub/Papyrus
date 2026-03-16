let library = JSON.parse(localStorage.getItem("library")) || [];
let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

// ===== Book Constructor =====
function Book(title, author, status="want", rating=0, cover="https://via.placeholder.com/100", notes="", tags=[]) {
  this.id = crypto.randomUUID(); // unique id for stability
  this.title = title;
  this.author = author;
  this.status = status;
  this.rating = rating;
  this.cover = cover;
  this.notes = notes;
  this.tags = tags;
}

// ===== Elements =====
const bookForm = document.getElementById("book-form");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const searchResults = document.getElementById("search-results");
const searchHistoryEl = document.getElementById("search-history");

const filterStatus = document.getElementById("filter-status");
const sortBy = document.getElementById("sort-by");

// Modal
const modal = document.getElementById("book-modal");
const modalCover = document.getElementById("modal-cover");
const modalTitle = document.getElementById("modal-title");
const modalAuthor = document.getElementById("modal-author");
const modalPublish = document.getElementById("modal-publish");
const modalDesc = document.getElementById("modal-description");
const closeBtn = document.querySelector(".close-btn");

// Stats container
let statsContainer = document.getElementById("library-stats");
if(!statsContainer){
  statsContainer = document.createElement("section");
  statsContainer.id = "library-stats";
  document.body.insertBefore(statsContainer, document.getElementById("library-section"));
}

// ===== Toast =====
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(()=>{
    toast.classList.remove("show");
  },2000);
}

// ===== Save Library =====
function saveLibrary(){
  localStorage.setItem("library", JSON.stringify(library));
}

// ===== Add Book Form =====
bookForm.addEventListener("submit", e=>{
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const status = document.getElementById("status").value;

  if(!title || !author) return;

  if(library.some(b=>b.title.toLowerCase()===title.toLowerCase() &&
                     b.author.toLowerCase()===author.toLowerCase())){
    showToast("Book already in library");
    return;
  }

  library.push(new Book(title,author,status));

  saveLibrary();
  bookForm.reset();
  renderLibrary();
  showToast("Book added");
});

// ===== OpenLibrary Search =====
async function performSearch(query){

  query = query || searchInput.value.trim();
  if(!query){
    showToast("Enter a search term");
    return;
  }

  searchResults.innerHTML = "<p>Searching...</p>";

  saveSearchHistory(query);

  try{

    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
    const data = await res.json();

    searchResults.innerHTML = "";

    if(!data.docs || data.docs.length===0){
      searchResults.innerHTML = "<p>No results found</p>";
      return;
    }

    data.docs.forEach(doc=>{

      const title = doc.title || "Unknown Title";
      const author = doc.author_name ? doc.author_name.join(", ") : "Unknown Author";
      const cover = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : "https://via.placeholder.com/100";

      const card = document.createElement("div");
      card.className="bookCard";

      card.innerHTML = `
        <img src="${cover}">
        <h4>${title}</h4>
        <p>${author}</p>
        <button class="add-btn">Add Book</button>
      `;

      card.querySelector(".add-btn").addEventListener("click",()=>{

        if(library.some(b=>b.title===title && b.author===author)){
          showToast("Book already in library");
          return;
        }

        library.push(new Book(title,author,"want",0,cover));
        saveLibrary();
        renderLibrary();

        searchResults.innerHTML="";
        searchInput.value="";

        showToast("Book added");

      });

      searchResults.appendChild(card);

    });

  }catch(err){

    searchResults.innerHTML="<p>Error loading results</p>";
    console.error(err);

  }
}

// ===== Search History =====
function saveSearchHistory(query){

  if(searchHistory.includes(query)) return;

  searchHistory.unshift(query);

  if(searchHistory.length>5)
    searchHistory.pop();

  localStorage.setItem("searchHistory",JSON.stringify(searchHistory));

  renderSearchHistory();

}

function renderSearchHistory(){

  searchHistoryEl.innerHTML="";

  searchHistory.forEach(q=>{

    const btn=document.createElement("button");
    btn.textContent=q;

    btn.addEventListener("click",()=>performSearch(q));

    searchHistoryEl.appendChild(btn);

  });

}

// ===== Render Library =====
function renderLibrary(){

  const wantShelf=document.getElementById("wantShelf");
  const readingShelf=document.getElementById("readingShelf");
  const finishedShelf=document.getElementById("finishedShelf");

  wantShelf.innerHTML="";
  readingShelf.innerHTML="";
  finishedShelf.innerHTML="";

  let filtered=[...library];

  if(filterStatus.value!=="all")
    filtered=filtered.filter(b=>b.status===filterStatus.value);

  if(sortBy.value==="title")
    filtered.sort((a,b)=>a.title.localeCompare(b.title));

  if(sortBy.value==="author")
    filtered.sort((a,b)=>a.author.localeCompare(b.author));

  if(sortBy.value==="rating")
    filtered.sort((a,b)=>b.rating-a.rating);

  filtered.forEach(book=>{

    const card=document.createElement("div");
    card.className="bookCard";
    card.draggable=true;
    card.dataset.id=book.id;

    let starsHTML="<div class='stars'>";
    for(let i=1;i<=5;i++)
      starsHTML+=`<span class="star" data-star="${i}">&#9733;</span>`;
    starsHTML+="</div>";

    card.innerHTML=`
      <img src="${book.cover}">
      <h4>${book.title}</h4>
      <p>${book.author}</p>

      <select class="status-dropdown">
        <option value="want" ${book.status==="want"?"selected":""}>Want To Read</option>
        <option value="reading" ${book.status==="reading"?"selected":""}>Reading</option>
        <option value="finished" ${book.status==="finished"?"selected":""}>Finished</option>
      </select>

      ${starsHTML}

      <button class="remove-btn">Remove</button>
    `;

    // ===== Status Change =====
    card.querySelector(".status-dropdown").addEventListener("change",e=>{
      book.status=e.target.value;
      saveLibrary();
      renderLibrary();
    });

    // ===== Rating =====
    const stars=card.querySelectorAll(".star");

    stars.forEach(star=>{

      const value=parseInt(star.dataset.star);

      star.style.color=value<=book.rating?"gold":"grey";

      star.addEventListener("click",()=>{
        book.rating=value;
        saveLibrary();
        renderLibrary();
      });

    });

    // ===== Remove =====
    card.querySelector(".remove-btn").addEventListener("click",()=>{
      library = library.filter(b=>b.id!==book.id);
      saveLibrary();
      renderLibrary();
      showToast("Book removed");
    });

    // ===== Drag =====
    card.addEventListener("dragstart",e=>{
      e.dataTransfer.setData("id",book.id);
    });

    // ===== Modal =====
    card.addEventListener("click",e=>{

      if(e.target.tagName==="BUTTON" ||
         e.target.tagName==="SELECT" ||
         e.target.classList.contains("star"))
         return;

      modalCover.src=book.cover;
      modalTitle.textContent=book.title;
      modalAuthor.textContent="Author: "+book.author;
      modalDesc.textContent=book.notes || "No notes yet";

      modal.style.display="block";

    });

    if(book.status==="want") wantShelf.appendChild(card);
    if(book.status==="reading") readingShelf.appendChild(card);
    if(book.status==="finished") finishedShelf.appendChild(card);

  });

  setupDragAndDrop();

  renderStats();

}

// ===== Drag & Drop =====
function setupDragAndDrop(){

  const shelves=document.querySelectorAll(".drop-zone");

  shelves.forEach(shelf=>{

    shelf.addEventListener("dragover",e=>{
      e.preventDefault();
      shelf.classList.add("drag-over");
    });
