window.onload=function(){ //entry point
  initGame();
};
//fields for game ---------------------------
var debug= false;
var turn = 0;
var turnstr=["black","white"];
var maxdims = 1;
var stonelist=[]; //stoned[p][s][d]=location of s th stone of player p in dim d.
var isCom    = [false,false]; //isCom[p]=true when player p is COM
var COM_DELAY = 500; //[ms] wait before COM's move in COM vs COM
var gameId   = 0;   //incremented by initGame to cancel the COM of an old game
var thinking = false;
//get game mode from radio buttons ----------
var getIsCom=function(){
  var checked=document.querySelector('input[name="mode"]:checked');
  var mode=checked?checked.value:"com-human";
  if(mode=="com-human") return [true ,false];
  if(mode=="human-com") return [false,true ];
  if(mode=="com-com"  ) return [true ,true ];
  return [false,false];
};
//initialize game----------------------------
var initGame=function(){
  gameId++;
  thinking=false;
  isCom=getIsCom();
  document.getElementById("console").innerHTML = "";
  putOut("GAME START!<br>");
  stonelist=[
    [//p=0
      [0]//s=0
    ],
    [//p=1
    ]
  ];
  putOut(turnstr[0]+"1> (0)<br>");
  turn=1;
  maxdims=1;
  putOut(turnstr[turn]+(stonelist[turn].length+1)+"> ");
  if(debug){
    putDebug("stonelist="+stonelist.toString()+"<br>");
  }
  startComIfTurn();
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
      initGame();
      return "";
    }
  }
  if(thinking || isCom[turn]) return getIn(); // COM's turn
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
      putOut(turnstr[turn]+(stonelist[turn].length+1)+"> ");
      return form1.command.value;
    }
    newstone[d]=parseInt(a[d]);
    if(isNaN(newstone[d])){
      putOut("\""+a[d]+"\""+"is not a number.<br>");
      putOut(turnstr[turn]+(stonelist[turn].length+1)+"> ");
      return form1.command.value;
    }
  }// for dt

  //check onto
  if(getStone(newstone)!=-1){
    putOut("[error] already put.<br>");
    putOut(turnstr[turn]+(stonelist[turn].length+1)+"> ");
    return form1.command.value;
  }

  if(playMove(newstone)) return ""; //game is over
  startComIfTurn();
  return form1.command.value;
};
//COM plays when it is COM's turn ----------
var startComIfTurn=function(){
  if(!isCom[turn]) return;
  thinking=true;
  putOut("(thinking...)");
  var id=gameId;
  setTimeout(function(){ //let the browser draw the output first
    if(id!=gameId) return;
    var m=comChooseMove(stonelist,turn);
    if(id!=gameId) return;
    thinking=false;
    var con=document.getElementById("console");
    con.innerHTML=con.innerHTML.replace(/\(thinking\.\.\.\)$/,"");
    if(!playMove(m)) startComIfTurn(); //next COM in COM vs COM
  },(isCom[0]&&isCom[1])?COM_DELAY:50);
};
/* put the stone of the current player on newstone.
  returns true when the game is over. */
var playMove=function(newstone){
  //put
  stonelist[turn].push(newstone);
  if(maxdims<newstone.length) maxdims=newstone.length;

  //out
  putOut("(");
  for(var d=0;d<maxdims;d++){
    var l=0;
    if(d<newstone.length) l=newstone[d];
    putOut(l);
    if(d!=maxdims-1) putOut(",");
  }
  putOut(")<br>");

  //judge win
  var r=judgeMove(stonelist,newstone,turn);
  if(r==RESULT_LOSE){ // black made 6 or more
    gameOver(turnstr[1]+" won! (too long for black)");
    return true;
  }
  if(r==RESULT_WIN){
    gameOver(turnstr[turn]+" won!");
    return true;
  }

  //next turn
  turn=(turn+1) % 2;
  putOut(turnstr[turn]+(stonelist[turn].length+1)+"> ");

  //debugout
  document.getElementById("debugout").innerHTML="";
  if(debug){
    putDebug("stonelist="+stonelist.toString()+"<br>");
  }
  return false;
};
var gameOver=function(msg){
  putOut(msg+"<br>");
  var id=gameId;
  setTimeout(function(){ //show the last move before alert
    if(id!=gameId) return;
    alert(msg);
    initGame();
  },50);
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
var getStone=function(place){
  var maxdims2 = maxdims; //max number of dimensions including place
  if(maxdims2<place.length) maxdims2=place.length;

  for(var p=0;p<2;p++){
    for(var s=0;s<stonelist[p].length;s++){
      var isfound=true;
      for(var d=0;d<maxdims2;d++){
        var pl=0;
        var sl=0;
        if(d<place          .length) pl=place[d];
        if(d<stonelist[p][s].length) sl=stonelist[p][s][d];
        if(pl!=sl){
          isfound=false;
          break;
        }
      }
      if(isfound) return p;
    }
  }// for p
  return -1;
}
