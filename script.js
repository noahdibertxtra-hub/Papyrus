// Load books from localStorage
let books = JSON.parse(localStorage.getItem("books")) || [];

// Save books to localStorage
function saveBooks(){
  localStorage.setItem("books", JSON.stringify(books));
}

// Add book manually
function addBook(){
  let title = document.getElementById("title").value;
  let author = document.getElementById("author").value;
  let status = document.getElementById("status").value;

  if(title.trim()==="") return alert("Title required");

  let book = {
    title,
    author,
    status,
    rating:"",
    cover:""
  };

  books.push(book);
  saveBooks();
  displayBooks();

  document.getElementById("title").value="";
  document.getElementById("author").value="";
}

// Delete book
function deleteBook(index){
  books.splice(index,1);
  saveBooks();
  displayBooks();
}

// Display books in library
function displayBooks(){
  let list = document.getElementById("bookList");
  list.innerHTML="";

  books.forEach((book,index)=>{
    let cover = book.cover ? `https://covers.openlibrary.org/b/id/${book.cover}-M.jpg` : "";

    let div = document.createElement("div");
    div.className="book";
    div.innerHTML=`
      ${cover ? `<img src="${cover}">` : ""}
      <strong>${book.title}</strong><br>
      ${book.author || "Unknown"}<br>
      Status: ${book.status}<br>
      Rating: 
      <span class="star" onclick="rateBook(${index},1)">★</span>
      <span class="star" onclick="rateBook(${index},2)">★</span>
      <span class="star" onclick="rateBook(${index},3)">★</span>
      <span class="star" onclick="rateBook(${index},4)">★</span>
      <span class="star" onclick="rateBook(${index},5)">★</span>
      (${book.rating || 0})<br>
      <button onclick="deleteBook(${index})">Delete</button>
    `;
    list.appendChild(div);
  });

  updateStats();
}

// Rate a book
function rateBook(index,rating){
  books[index].rating = rating;
  saveBooks();
  displayBooks();
}

// Update reading stats
function updateStats(){
  let finished = books.filter(b=>b.status==="finished").length;
  let reading = books.filter(b=>b.status==="reading").length;
  let want = books.filter(b=>b.status==="want").length;

  document.getElementById("stats").innerHTML=`
    Books Finished: ${finished}<br>
    Currently Reading: ${reading}<br>
    Want to Read: ${want}
  `;
}

// SEARCH BOOKS USING OPEN LIBRARY
async function searchBooks(){
  let query = document.getElementById("searchInput").value;
  if(query.trim()==="") return;

  let response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`);
  let data = await response.json();

  displayResults(data.docs.slice(0,10));
}

// Display search results
function displayResults(results){
  let container = document.getElementById("searchResults");
  container.innerHTML="";

  results.forEach(book=>{
    let cover = book.cover_i || "";
    let author = book.author_name ? book.author_name[0] : "Unknown";

    let div = document.createElement("div");
    div.className="book";
    div.innerHTML=`
      ${cover ? `<img src="https://covers.openlibrary.org/b/id/${cover}-M.jpg">` : ""}
      <strong>${book.title}</strong><br>
      ${author}<br>
      <button onclick="addFromSearch('${book.title.replace(/'/g,"\\'")}','${author.replace(/'/g,"\\'")}','${cover}')">Add</button>
    `;
    container.appendChild(div);
  });
}

// Add book from search
function addFromSearch(title,author,cover){
  let book = {
    title,
    author,
    status:"want",
    rating:"",
    cover
  };
  books.push(book);
  saveBooks();
  displayBooks();
}

// Run on page load
displayBooks();
