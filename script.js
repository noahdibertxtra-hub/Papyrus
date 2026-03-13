// ===== Papyrus Phase 2 Script =====

// Load library
let library = [];
try { library = JSON.parse(localStorage.getItem("library")) || []; }
catch { library = []; localStorage.setItem("library", JSON.stringify(library)); }

function Book(title, author, status="want", rating=0, cover="https://via.placeholder.com/100") {
  this.title = title; this.author = author; this.status = status; this.rating = rating; this.cover = cover;
}

// ===== Elements =====
const bookForm = document.getElementById("book-form");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const searchResults = document.getElementById("search-results");
const searchHistoryEl = document.getElementById("search-history");
const filterStatus = document.getElementById("filter-status");
const sortBy = document.getElementById("sort-by");
const modal = document.getElementById("book-modal");
const modalCover = document.getElementById("modal-cover");
const modalTitle = document.getElementById("modal-title");
const modalAuthor = document.getElementById("modal-author");
const modalPublish = document.getElementById("modal-publish");
const modalDescription = document.getElementById("modal-description");
const closeBtn = document.querySelector(".close-btn");

// ===== Helpers =====
function showMessage(msg, duration=2000) {
  const m = document.createElement("div");
  m.textContent = msg;
  Object.assign(m.style,{position:"fixed",top:"10px",left:"50%",transform:"translateX(-50%)",
    backgroundColor:"#4CAF50",color:"#fff",padding:"8px 12px",borderRadius:"5px",zIndex:"1000"});
  document.body.appendChild(m);
  setTimeout(()=>m.remove(), duration);
}

function saveLibrary() { localStorage.setItem("library", JSON.stringify(library)); }

function saveSearchHistory(query){
  let history = JSON.parse(localStorage.getItem("searchHistory")||"[]");
  if(!history.includes(query)) history.unshift(query);
  if(history.length>5) history.pop();
  localStorage.setItem("searchHistory", JSON.stringify(history));
  renderSearchHistory();
}

function renderSearchHistory(){
  searchHistoryEl.innerHTML = "";
  let history = JSON.parse(localStorage.getItem("searchHistory")||"[]");
  history.forEach(q=>{
    const btn = document.createElement("button");
    btn.textContent = q; btn.className="history-btn";
    btn.addEventListener("click",()=>{ searchInput.value=q; performSearch(); });
    searchHistoryEl.appendChild(btn);
  });
}

// ===== Modal =====
function showModal(book){
  modalCover.src = book.cover;
  modalTitle.textContent = book.title;
  modalAuthor.textContent = book.author;
  modalPublish.textContent = book.publishDate || "";
  modalDescription.textContent = book.description || "";
  modal.style.display="block";
}
closeBtn.addEventListener("click",()=>modal.style.display="none");
window.addEventListener("click",e=>{if(e.target===modal) modal.style.display="none";});

// ===== Render Library =====
function renderLibrary(){
  const shelves = {
    want: document.getElementById("wantShelf"),
    reading: document.getElementById("readingShelf"),
    finished: document.getElementById("finishedShelf")
  };
  Object.values(shelves).forEach(s=>s.innerHTML="");

  // Apply filter
  let filtered = filterStatus.value==="all"?library:library.filter(b=>b.status===filterStatus.value);

  // Apply sort
  filtered.sort((a,b)=>{
    if(sortBy.value==="title") return a.title.localeCompare(b.title);
    if(sortBy.value==="author") return a.author.localeCompare(b.author);
    if(sortBy.value==="rating") return b.rating - a.rating;
  });

  filtered.forEach((book,index)=>{
    const card = document.createElement("div"); card.className="bookCard"; card.draggable=true;

    // Stars
    let starsHTML = `<div class="stars">`; for(let i=1;i<=5;i++) starsHTML+=`<span class="star">&#9733;</span>`; starsHTML+="</div>";

    card.innerHTML=`
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

    // Open modal on click (avoid buttons)
    card.addEventListener("click", e=>{
      if(!e.target.classList.contains("remove-btn") && !e.target.classList.contains("star") && e.target.tagName!=="SELECT")
        showModal(book);
    });

    // Status change
    card.querySelector(".status-dropdown").addEventListener("change",e=>{
      const idx = e.target.dataset.index;
      library[idx].status = e.target.value;
      saveLibrary(); renderLibrary();
      showMessage("Book status updated!");
    });

    // Star ratings
    const stars = card.querySelectorAll(".star");
    stars.forEach((s,i)=>{
      s.addEventListener("mouseenter",()=>stars.forEach((st,idx)=>st.style.color=idx<=i?"gold":"grey"));
      s.addEventListener("mouseleave",()=>stars.forEach((st,idx)=>st.style.color=idx<book.rating?"gold":"grey"));
      s.addEventListener("click",()=>{ book.rating=i+1; saveLibrary(); renderLibrary(); showMessage(`Rated ${i+1} star${i+1>1?"s":""}`); });
    });
    stars.forEach((s,i)=>s.style.color=i<book.rating?"gold":"grey");

    // Remove
    card.querySelector(".remove-btn").addEventListener("click",()=>{
      const idx = library.indexOf(book);
      library.splice(idx,1); saveLibrary(); renderLibrary(); showMessage("Book removed!");
    });

    // Drag & Drop
    card.addEventListener("dragstart", e=>{ e.dataTransfer.setData("text/plain", index); });
    shelves[book.status].appendChild(card);
  });

  enableDropZones();
}

// ===== Drag & Drop for Shelves =====
function enableDropZones(){
  document.querySelectorAll(".drop-zone").forEach(zone=>{
    zone.addEventListener("dragover", e=>{ e.preventDefault(); zone.classList.add("drag-over"); });
    zone.addEventListener("dragleave", ()=>zone.classList.remove("drag-over"));
    zone.addEventListener("drop", e=>{
      e.preventDefault(); zone.classList.remove("drag-over");
      const idx = e.dataTransfer.getData("text/plain");
      const book = library[idx];
      const newStatus = zone.parentElement.dataset.status;
      book.status = newStatus; saveLibrary(); renderLibrary();
      showMessage(`Moved "${book.title}" to ${newStatus} shelf!`);
    });
  });
}

// ===== Add Book Form =====
bookForm.addEventListener("submit", e=>{
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const status = document.getElementById("status").value;
  if(!title||!author){ showMessage("Enter title & author"); return; }
  if(library.some(b=>b.title.toLowerCase()===title.toLowerCase() && b.author.toLowerCase()===author.toLowerCase())){
    showMessage("Book already in library!"); return;
  }
  const newBook = new Book(title,author,status);
  library.push(newBook); saveLibrary(); renderLibrary(); bookForm.reset(); showMessage("Book added!");
});

// ===== Open Library Search =====
async function performSearch(){
  const query = searchInput.value.trim();
  if(!query){ showMessage("Enter search term"); return; }
  searchResults.innerHTML="<p>Searching...</p>"; saveSearchHistory(query);
  try{
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
    const data = await res.json();
    searchResults.innerHTML="";
    if(!data.docs || data.docs.length===0){ searchResults.innerHTML="<p>No results found.</p>"; return; }
    data.docs.forEach(doc=>{
      const card=document.createElement("div"); card.className="bookCard";
      const title = doc.title || "No Title";
      const author = doc.author_name ? doc.author_name.join(", ") : "Unknown Author";
      const cover = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "https://via.placeholder.com/100";
      card.innerHTML=`
        <img src="${cover}" alt="Book Cover">
        <h4>${title}</h4>
        <p>${author}</p>
        <button class="add-btn">Add Book</button>
      `;
      card.querySelector(".add-btn").addEventListener("click",()=>{
        if(!library.some(b=>b.title.toLowerCase()===title.toLowerCase() && b.author.toLowerCase()===author.toLowerCase())){
          library.push(new Book(title,author,"want",0,cover)); saveLibrary(); renderLibrary(); searchResults.innerHTML=""; searchInput.value=""; showMessage("Book added!");
        } else { showMessage("Book already in library!"); }
      });
      searchResults.appendChild(card);
    });
  } catch(err){ searchResults.innerHTML="<p>Error fetching results.</p>"; console.error(err); }
}

searchButton.addEventListener("click", performSearch);
searchInput.addEventListener("keyup", e=>{if(e.key==="Enter") performSearch();});
filterStatus.addEventListener("change", renderLibrary);
sortBy.addEventListener("change", renderLibrary);

// ===== Initial Render =====
renderSearchHistory();
renderLibrary();
