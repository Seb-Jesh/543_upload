// Node.js program to demonstrate the
// fs.readFileSync() method
/*
// Include fs module
const fs = require("fs");

// Calling the fs.readFile() method
// for reading file 'input1.txt'
fs.readFile(
  "./input1.txt",
  { encoding: "utf8", flag: "r" },
  function (err, data) {
    if (err) console.log(err);
    else console.log(data);
  }
);

// Calling the fs.readFileSync() method
// for reading file 'input2.txt'
const data = fs.readFileSync("./input2.txt", { encoding: "utf8", flag: "r" });

// Display data
console.log(data);
*/

const reader = require('xlsx')

const inputElement = document.getElementById("myFile");
inputElement.addEventListener("change", handleFileAsync, false)

async function handleFileAsync(e) {
  // const file = e.target.files[0];
  const file = reader.readFile(e.target.files[0])
  // const data = await file.arrayBuffer();
  let data = []
  // /* data is an ArrayBuffer */
  // const workbook = reader.read(data);

  /* DO SOMETHING WITH workbook HERE */

  const sheets = file.SheetNames 
    
  for(let i = 0; i < sheets.length; i++) 
  { 
    const temp = reader.utils.sheet_to_json( 
          file.Sheets[file.SheetNames[i]]) 
    temp.forEach((res) => { 
        data.push(res) 
    }) 
  } 
    
  // Printing data 
  console.log(data)
}
  
// // Reading our test file 
// const file = reader.readFile('./paysmart.xlsx') 
  
// let data = []

// const sheets = file.SheetNames 
  
// for(let i = 0; i < sheets.length; i++) 
// { 
//    const temp = reader.utils.sheet_to_json( 
//         file.Sheets[file.SheetNames[i]]) 
//    temp.forEach((res) => { 
//       data.push(res) 
//    }) 
// } 
  
// // Printing data 
// console.log(data)
