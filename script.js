// ==========================
// STORAGE
// ==========================

let library = JSON.parse(localStorage.getItem("library")) || [];
let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
let customShelves = JSON.parse(localStorage.getItem("customShelves")) || [];

function saveLibrary(){
localStorage.setItem("library",JSON.stringify(library));
}

function saveShelves(){
localStorage.setItem("customShelves",JSON.stringify(customShelves));
}

// ==========================
// BOOK MODEL
// ==========================

function Book(title,author,status="want",rating=0,cover="https://via.placeholder.com/100",pages=0){

this.id = Date.now();

this.title = title;
this.author = author;

this.status = status;

this.rating = rating;

this.cover = cover;

this.pages = pages;

this.progress = 0;

this.review = "";

this.shelves = [];

}

// ==========================
// ELEMENTS
// ==========================

const bookForm = document.getElementById("book-form");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const searchResults = document.getElementById("search-results");

const filterStatus = document.getElementById("filter-status");
const sortBy = document.getElementById("sort-by");

// modal

const modal = document.getElementById("book-modal");
const modalCover = document.getElementById("modal-cover");
const modalTitle = document.getElementById("modal-title");
const modalAuthor = document.getElementById("modal-author");

const modalProgress = document.getElementById("modal-progress");
const modalReview = document.getElementById("modal-review");

const saveDetailsBtn = document.getElementById("save-book-details");

const closeBtn = document.querySelector(".close-btn");

let activeBook = null;

// ==========================
// BOOK FORM
// ==========================

bookForm.addEventListener("submit",e=>{

e.preventDefault();

const title=document.getElementById("title").value.trim();
const author=document.getElementById("author").value.trim();
const status=document.getElementById("status").value;

if(!title||!author) return;

library.push(new Book(title,author,status));

saveLibrary();

bookForm.reset();

renderLibrary();

});

// ==========================
// SEARCH
// ==========================

async function performSearch(query){

query=query||searchInput.value.trim();

if(!query) return alert("Enter search term");

searchResults.innerHTML="Searching...";

try{

const res=await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);

const data=await res.json();

searchResults.innerHTML="";

data.docs.forEach(doc=>{

const title=doc.title||"No Title";
const author=doc.author_name?doc.author_name.join(", "):"Unknown";

const cover=doc.cover_i?`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`:"https://via.placeholder.com/100";

const pages=doc.number_of_pages_median||0;

const card=document.createElement("div");
card.className="bookCard";

card.innerHTML=`

<img src="${cover}">
<h4>${title}</h4>
<p>${author}</p>
<button>Add Book</button>

`;

card.querySelector("button").onclick=()=>{

library.push(new Book(title,author,"want",0,cover,pages));

saveLibrary();

renderLibrary();

};

searchResults.appendChild(card);

});

}catch{

searchResults.innerHTML="Error fetching results.";

}

}

// ==========================
// RENDER LIBRARY
// ==========================

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

filtered.forEach((book,index)=>{

const card=document.createElement("div");

card.className="bookCard";

card.draggable=true;

let progressPercent=0;

if(book.pages>0)
progressPercent=(book.progress/book.pages)*100;

card.innerHTML=`

<img src="${book.cover}">
<h4>${book.title}</h4>
<p>${book.author}</p>

<div class="progress-container">
<div class="progress-bar" style="width:${progressPercent}%"></div>
</div>

<label>Status</label>

<select class="status-dropdown">

<option value="want" ${book.status==="want"?"selected":""}>Want To Read</option>

<option value="reading" ${book.status==="reading"?"selected":""}>Reading</option>

<option value="finished" ${book.status==="finished"?"selected":""}>Finished</option>

</select>

<button class="remove-btn">Remove</button>

`;

card.querySelector(".status-dropdown").onchange=e=>{

library[index].status=e.target.value;

saveLibrary();

renderLibrary();

};

card.querySelector(".remove-btn").onclick=()=>{

library.splice(index,1);

saveLibrary();

renderLibrary();

};

card.onclick=e=>{

if(e.target.tagName==="SELECT"||e.target.classList.contains("remove-btn")) return;

openModal(book);

};

if(book.status==="want") wantShelf.appendChild(card);
if(book.status==="reading") readingShelf.appendChild(card);
if(book.status==="finished") finishedShelf.appendChild(card);

});

}

// ==========================
// MODAL
// ==========================

function openModal(book){

activeBook=book;

modalCover.src=book.cover;

modalTitle.textContent=book.title;

modalAuthor.textContent="Author: "+book.author;

modalProgress.value=book.progress;

modalReview.value=book.review;

modal.style.display="block";

}

saveDetailsBtn.onclick=()=>{

activeBook.progress=parseInt(modalProgress.value)||0;

activeBook.review=modalReview.value;

saveLibrary();

renderLibrary();

modal.style.display="none";

};

closeBtn.onclick=()=>modal.style.display="none";

// ==========================
// EVENTS
// ==========================

searchButton.onclick=()=>performSearch();

searchInput.addEventListener("keyup",e=>{
if(e.key==="Enter") performSearch();
});

filterStatus.onchange=renderLibrary;

sortBy.onchange=renderLibrary;

// ==========================
// INIT
// ==========================

renderLibrary();
