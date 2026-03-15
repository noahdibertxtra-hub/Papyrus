let library = JSON.parse(localStorage.getItem("library")) || [];
let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

function Book(title,author,status="want",rating=0,cover="https://via.placeholder.com/100"){
this.title=title;
this.author=author;
this.status=status;
this.rating=rating;
this.cover=cover;
}

const bookForm=document.getElementById("book-form");
const searchInput=document.getElementById("search-input");
const searchButton=document.getElementById("search-button");
const searchResults=document.getElementById("search-results");
const searchHistoryEl=document.getElementById("search-history");

const filterStatus=document.getElementById("filter-status");
const sortBy=document.getElementById("sort-by");

const modal=document.getElementById("book-modal");
const modalCover=document.getElementById("modal-cover");
const modalTitle=document.getElementById("modal-title");
const modalAuthor=document.getElementById("modal-author");
const modalPublish=document.getElementById("modal-publish");
const modalDesc=document.getElementById("modal-description");
const closeBtn=document.querySelector(".close-btn");

function showToast(message){
const toast=document.getElementById("toast");
toast.textContent=message;
toast.classList.add("show");

setTimeout(()=>{
toast.classList.remove("show");
},2000);
}

bookForm.addEventListener("submit",e=>{
e.preventDefault();

const title=document.getElementById("title").value.trim();
const author=document.getElementById("author").value.trim();
const status=document.getElementById("status").value;

if(!title||!author)return;

if(library.some(b=>b.title.toLowerCase()===title.toLowerCase()&&b.author.toLowerCase()===author.toLowerCase())){
showToast("Book already in library");
return;
}

library.push(new Book(title,author,status));

localStorage.setItem("library",JSON.stringify(library));

bookForm.reset();

renderLibrary();

showToast("Book added");
});

async function performSearch(){

const query=searchInput.value.trim();

if(!query)return;

searchResults.innerHTML="Searching...";

try{

const res=await fetch(`https://openlibrary.org/search.json?q=${query}&limit=10`);

const data=await res.json();

searchResults.innerHTML="";

data.docs.forEach(doc=>{

const title=doc.title||"No Title";
const author=doc.author_name?doc.author_name[0]:"Unknown";
const cover=doc.cover_i?`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`:"https://via.placeholder.com/100";

const card=document.createElement("div");
card.className="bookCard";

card.innerHTML=`
<img src="${cover}">
<h4>${title}</h4>
<p>${author}</p>
<button>Add Book</button>
`;

card.querySelector("button").addEventListener("click",()=>{

if(library.some(b=>b.title.toLowerCase()===title.toLowerCase()&&b.author.toLowerCase()===author.toLowerCase())){
showToast("Book already in library");
return;
}

library.push(new Book(title,author,"want",0,cover));

localStorage.setItem("library",JSON.stringify(library));

renderLibrary();

showToast("Book added");

});

searchResults.appendChild(card);

});

}catch(err){

searchResults.innerHTML="Search failed";

}

}

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

let starsHTML="<div class='stars'>";

for(let i=1;i<=5;i++)
starsHTML+=`<span class="star">&#9733;</span>`;

starsHTML+="</div>";

card.innerHTML=`
<img src="${book.cover}">
<h4>${book.title}</h4>
<p>${book.author}</p>

<select class="status-dropdown">

<option value="want"${book.status==="want"?"selected":""}>Want</option>
<option value="reading"${book.status==="reading"?"selected":""}>Reading</option>
<option value="finished"${book.status==="finished"?"selected":""}>Finished</option>

</select>

${starsHTML}

<button class="remove-btn">Remove</button>
`;

card.querySelector(".status-dropdown").addEventListener("change",e=>{

book.status=e.target.value;

localStorage.setItem("library",JSON.stringify(library));

renderLibrary();

});

const stars=card.querySelectorAll(".star");

stars.forEach((s,i)=>{

s.addEventListener("click",()=>{

book.rating=i+1;

localStorage.setItem("library",JSON.stringify(library));

renderLibrary();

});

s.style.color=i<book.rating?"gold":"grey";

});

card.querySelector(".remove-btn").addEventListener("click",()=>{

library.splice(index,1);

localStorage.setItem("library",JSON.stringify(library));

renderLibrary();

showToast("Book removed");

});

card.addEventListener("click",e=>{

if(e.target.tagName==="SELECT"||e.target.classList.contains("star")||e.target.classList.contains("remove-btn"))
return;

modalCover.src=book.cover;
modalTitle.textContent=book.title;
modalAuthor.textContent="Author: "+book.author;
modal.style.display="block";

});

if(book.status==="want")wantShelf.appendChild(card);
if(book.status==="reading")readingShelf.appendChild(card);
if(book.status==="finished")finishedShelf.appendChild(card);

});

}

closeBtn.onclick=()=>modal.style.display="none";

window.onclick=e=>{
if(e.target===modal)
modal.style.display="none";
};

searchButton.addEventListener("click",performSearch);

searchInput.addEventListener("keyup",e=>{
if(e.key==="Enter")
performSearch();
});

filterStatus.addEventListener("change",renderLibrary);
sortBy.addEventListener("change",renderLibrary);

renderLibrary();
