let library = JSON.parse(localStorage.getItem("library")) || [];
let shelves = JSON.parse(localStorage.getItem("shelves")) || [];

const grid = document.getElementById("library-grid");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const results = document.getElementById("search-results");

const filterStatus = document.getElementById("filter-status");
const filterShelf = document.getElementById("filter-shelf");
const sortBy = document.getElementById("sort-by");

const modal = document.getElementById("book-modal");
const modalTitle = document.getElementById("modal-title");
const modalAuthor = document.getElementById("modal-author");
const modalCover = document.getElementById("modal-cover");
const modalProgress = document.getElementById("modal-progress");
const modalReview = document.getElementById("modal-review");

let activeBook = null;

function Book(data){

this.id = Date.now();

this.title = data.title;

this.author = data.author;

this.cover = data.cover;

this.pages = data.pages || 0;

this.status = "want";

this.shelves = [];

this.rating = 0;

this.progress = 0;

this.review = "";

}

function save(){

localStorage.setItem("library",JSON.stringify(library));

localStorage.setItem("shelves",JSON.stringify(shelves));

}

function renderLibrary(){

grid.innerHTML="";

let books=[...library];

if(filterStatus.value!=="all"){

books=books.filter(b=>b.status===filterStatus.value);

}

if(filterShelf.value!=="all"){

books=books.filter(b=>b.shelves.includes(filterShelf.value));

}

if(sortBy.value==="title") books.sort((a,b)=>a.title.localeCompare(b.title));

if(sortBy.value==="author") books.sort((a,b)=>a.author.localeCompare(b.author));

if(sortBy.value==="rating") books.sort((a,b)=>b.rating-a.rating);

books.forEach(book=>{

const card=document.createElement("div");

card.className="book-card";

let progressPercent=0;

if(book.pages>0) progressPercent=(book.progress/book.pages)*100;

card.innerHTML=`

<img src="${book.cover}">

<h4>${book.title}</h4>

<p>${book.author}</p>

<div class="progress-bar">

<div class="progress-fill" style="width:${progressPercent}%"></div>

</div>

`;

card.onclick=()=>openModal(book);

grid.appendChild(card);

});

}

function openModal(book){

activeBook=book;

modalTitle.textContent=book.title;

modalAuthor.textContent=book.author;

modalCover.src=book.cover;

modalProgress.value=book.progress;

modalReview.value=book.review;

modal.style.display="block";

}

document.getElementById("save-book").onclick=()=>{

activeBook.progress=parseInt(modalProgress.value)||0;

activeBook.review=modalReview.value;

save();

renderLibrary();

modal.style.display="none";

};

document.querySelector(".close-btn").onclick=()=>modal.style.display="none";

searchButton.onclick=performSearch;

async function performSearch(){

const query=searchInput.value.trim();

if(!query) return;

results.innerHTML="Searching...";

const res=await fetch(`https://openlibrary.org/search.json?q=${query}&limit=10`);

const data=await res.json();

results.innerHTML="";

data.docs.forEach(doc=>{

const title=doc.title;

const author=doc.author_name?doc.author_name[0]:"Unknown";

const cover=doc.cover_i?`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`:"https://via.placeholder.com/100";

const pages=doc.number_of_pages_median||0;

const card=document.createElement("div");

card.className="book-card";

card.innerHTML=`

<img src="${cover}">

<h4>${title}</h4>

<p>${author}</p>

<button>Add</button>

`;

card.querySelector("button").onclick=()=>{

library.push(new Book({title,author,cover,pages}));

save();

renderLibrary();

};

results.appendChild(card);

});

}

document.getElementById("create-shelf").onclick=()=>{

const name=document.getElementById("new-shelf-name").value.trim();

if(!name) return;

shelves.push(name);

save();

renderShelves();

};

function renderShelves(){

const list=document.getElementById("shelf-list");

list.innerHTML="";

filterShelf.innerHTML=`<option value="all">All Shelves</option>`;

shelves.forEach(s=>{

const div=document.createElement("div");

div.textContent=s;

list.appendChild(div);

const opt=document.createElement("option");

opt.value=s;

opt.textContent=s;

filterShelf.appendChild(opt);

});

}

filterStatus.onchange=renderLibrary;

filterShelf.onchange=renderLibrary;

sortBy.onchange=renderLibrary;

renderShelves();

renderLibrary();
