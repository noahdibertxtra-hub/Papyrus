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
