export const arr1 = [{phone:"0974339546",service:"airtime"}]
const arr = arr1.every( (val) => val.service.toLowerCase() === arr1[0].service.toLowerCase() )
console.log(arr)