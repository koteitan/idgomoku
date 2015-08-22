window.onload=function(){ //entry point
  initGame();
};
//fields for game ---------------------------
var debug=1;
var turn = 0;
var turnstr=["black","white"];
var maxdim = 1;
var stonelist=[]; //stoned[p][s][d]=location of s th stone of player p in dim d.
//initialize game----------------------------
var initGame=function(){
  document.getElementById("console").innerHTML = "";
  putOut("The new game was initialized.<br>");  
  stonelist=[
    [//p=0
      [0]//s=0
    ],
    [//p=1
    ]
  ];
  
  putOut(turnstr[0]+"1> (0)<br>");
  turn=1;
  putOut(turnstr[turn]+(stonelist[turn].length+1)+"> ");
  if(debug){
    putDebug("stonelist="+stonelist.toString()+"<br>");
  }
};
//when push send button ---------------------
var receiveCommand=function(str){
  /* str = "d0 l0 d1 l1 d2 l2 ..."
    d = dimension
    l = location
  */
  var a = getIn().split(" ");
  if(a.length==1){
    if(a[0]=="init"||a[0]=="reset"){
      initgame();
      return "";
    }
  }
  if(!a.length%2!=0){
    putOut("error.");
    return "";
  }
  var dims = a.length;
  
  //new stone
  var newstone=new Array(dims); // newstone[d]=location of the new stone
  for(var d=0;d<dims;d++){
    if(!isFinite(a[d])){
      putOut("\""+a[d]+"\""+"is not a number.<br>");
      return form1.command.value;
    }
    newstone[d]=parseInt(a[d]);
  }// for dt

  //check onto
  if(getStone(newstone)!=-1){
    putOut("[error] already put.<br>");
    putOut(turnstr[turn]+(stonelist[turn].length+1)+"> ");
    return form1.command.value;
  }
  
  //put
  stonelist[turn].push(newstone);
  if(maxdim<newstone.length) maxdim=newstone.length;
  //out
  putOut("(");
  for(var d=0;d<newstone.length;d++){
    putOut(newstone[d]);
    if(d!=maxdim-1) putOut(",");
  }
  putOut(")<br>");
  turn=(turn+1) % 2;
  putOut(turnstr[turn]+(stonelist[turn].length+1)+"> ");

  //debugout
  document.getElementById("debugout").innerHTML="";
  if(debug){
    putDebug("stonelist="+stonelist.toString()+"<br>");
  }
  return form1.command.value;
};
var putOut=function(str){
  document.getElementById("console").innerHTML += str;
}
var putDebug=function(str){
  document.getElementById("debugout").innerHTML += str;
}
var getIn=function(){
  return form1.command.value;
}
/* getStone(place) returns the stone in the place.
  place[d]=location of target place in dimenstion d
  getStone(place)= 0:black
  getStone(place)= 1:white
  getStone(place)=-1:blank
*/
getStone=function(place){
  for(var p=0;p<2;p++){
    for(var s=0;s<stonelist[p].length;s++){
      var isfound=true;
      for(var d=0;d<place.length;d++){
        var l=0;
        if(d<maxdim) l=place[d];
        if(l!=stonelist[p][s][d]){
          isfound=false;
          break;
        }
      }
      if(isfound) return p;
    }
  }// for p
  return -1;
}


