window.onload=function(){ //entry point
  initGame();
};
//---------------------------
var initGame=function(){
  document.getElementById("console").innerHTML = "The new game was initialized.<br>";
};

var receiveCommand=function(str){
  document.getElementById("console").innerHTML += str+"<br>";
  form1.command.value="";
  return "";
};

