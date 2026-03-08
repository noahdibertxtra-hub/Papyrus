let books = JSON.parse(localStorage.getItem("books")) || [];

function saveBooks(){
localStorage.setItem("books", JSON.stringify(books));
}

function addBook(){

let title = document.getElementById("title").value;
let author = document.getElementById("author").value;
let status = document.getElementById("status").value;
let rating = document.getElementById("rating").value;

let book = {
title,
author,
status,
rating
};

books.push(book);

saveBooks();

displayBooks();

document.getElementById("title").value="";
document.getElementById("author").value="";
document.getElementById("rating").value="";
}

function deleteBook(index){
books.splice(index,1);
saveBooks();
displayBooks();
}

function displayBooks(){

let list = document.getElementById("bookList");

list.innerHTML="";

books.forEach((book,index)=>{

let div = document.createElement("div");

div.className="book";

div.innerHTML = `
<strong>${book.title}</strong> by ${book.author}<br>
Status: ${book.status}<br>
Rating: ${book.rating || "N/A"} ⭐<br>
<button onclick="deleteBook(${index})">Delete</button>
`;

list.appendChild(div);

});
}

displayBooks();
async function searchBooks(){

let query = document.getElementById("searchInput").value;

let response = await fetch(
`https://openlibrary.org/search.json?q=${query}`
);

let data = await response.json();

displayResults(data.docs.slice(0,10));

}

function displayResults(books){

let results = document.getElementById("searchResults");

results.innerHTML="";

books.forEach(book=>{

let cover = book.cover_i
? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
: "";

let div = document.createElement("div");

div.className="book";

div.innerHTML = `
<img src="${cover}" width="80"><br>
<strong>${book.title}</strong><br>
${book.author_name ? book.author_name[0] : "Unknown"}<br>
<button onclick="addFromSearch('${book.title}','${book.author_name ? book.author_name[0] : ""}')">
Add
</button>
`;

results.appendChild(div);

});
}

function addFromSearch(title,author){

let book = {
title:title,
author:author,
status:"want",
rating:""
};

books.push(book);

saveBooks();

displayBooks();

}
function addFromSearch(title,author,cover){

let book = {
title:title,
author:author,
status:"want",
Rating:
<span class="star" onclick="rateBook(${index},1)">★</span>
<span class="star" onclick="rateBook(${index},2)">★</span>
<span class="star" onclick="rateBook(${index},3)">★</span>
<span class="star" onclick="rateBook(${index},4)">★</span>
<span class="star" onclick="rateBook(${index},5)">★</span>

cover:cover
};

books.push(book);

saveBooks();

displayBooks();
}

function rateBook(index,rating){

books[index].rating = rating;

saveBooks();

displayBooks();

}

function updateStats(){

let finished = books.filter(b=>b.status==="finished").length;

let reading = books.filter(b=>b.status==="reading").length;

let want = books.filter(b=>b.status==="want").length;

document.getElementById("stats").innerHTML = `
Books Finished: ${finished}<br>
Currently Reading: ${reading}<br>
Want to Read: ${want}
`;

}

displayBooks(){
...
updateStats();
}
displayBooks();
