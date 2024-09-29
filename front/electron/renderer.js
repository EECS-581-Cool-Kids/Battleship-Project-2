//Description: testing for making sure electron loads correctly
//Inputs:
//Outputs: 
//Sources: electronjs.org
//Authors: Matthew Petillo
//Creation date: 9-10-24
const func = async () => {
  const response = await window.versions.ping()
  console.log(response) // prints out 'pong'
}

func()