//Description: testing for making sure electron loads correctly
//Inputs:
//Outputs: 
//Sources: electronjs.org
//Authors: Matthew Petillo
//Creation date: 9-10-24
const func = async () => {  //async function
  const response = await window.versions.ping()  //ping
  console.log(response) // prints out 'pong'
}  //end function

func()  //calls function