window.onload=function(){ //entry point
  initGame();
};
//fields for game ---------------------------
var turn = 0;
var turnstr=["black","white"];
var maxdim = 1;
var stoned=[]; //stoned[p][s]=demension of s th stone of player p.
var stonel=[]; //stonel[p][s]=location of s th stone of player p in stoned[p][s] dimension.
//initialize game----------------------------
var initGame=function(){
  document.getElementById("console").innerHTML = "";
  putOut("The new game was initialized.<br>");  
  stoned=[[[0]],[[]]];
  stonel=[[[0]],[[]]];
  putOut(turnstr[0]+"1> 0 0<br>");
  turn=1;
  putOut(turnstr[turn]+(stoned[turn].length+1)+"> ");
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
  var dts = a.length/2;
  
  //new stone
  var newstoned=new Array(dts); // dimension of new stone
  var newstonel=new Array(dts); // location  of new stone
  for(var dt=0;dt<dts;dt++){
    if(!isFinite(a[dt/2+0])){
      putOut("\""+a[dt/2+0]+"\""+"is not a number.<br>");
      return form1.command.value;
    }
    if(!isFinite(a[dt/2+1])){
      putOut("\""+a[dt/2+1]+"\""+"is not a number.<br>");
      return form1.command.value;
    }
    newstoned[dt]=parseInt(a[dt/2+0]);
    newstonel[dt]=parseInt(a[dt/2+1]);
  }// for dt

  //check onto
  var onto = false;
  for(var p=0;p<2;p++){
    for(var s=0;s<stoned[p].length;s++){
      var sdt_onto=true;
      for(var ndt=0;ndt<newstoned.length;ndt++){
        if(!sdt_onto) break;
        //search and set sdt in which ndt==sdt into sdt_equal (set 0 if not found)
        var sdt_equal=0;
        for(var sdt=0;sdt<stoned[p][s].length;sdt++){
          if(newstoned[ndt] == stoned[p][s][sdt]){
            if(newstonel[ndt] != stonel[p][s][sdt]){
              sdt_equal = sdt;
              break;
            }
          }//if
        }// for sdt
        if(newstoned[ndt] != stoned[p][s][sdt]){
          sdt_onto=false;
          break;
        }
      }//for ndt
      if(sdt_onto){
        onto=true;
        break;
      }
      if(onto) break;
    }//for s
    if(onto) break;
  }// for p
  if(onto){
    putOut("[error] already put.<br>");
    return form1.command.value;
  }
  
  //put
  stoned[turn].push(newstoned);
  stonel[turn].push(newstonel);

  //out
  for(var dt=0;dt<newstoned.length;dt++){
    putOut(newstoned[dt]+" "+newstonel[dt]+" ");
  }
  putOut("<br>");
  turn=(turn+1) % 2;
  putOut(turnstr[turn]+(stoned[turn].length+1)+"> ");
  return form1.command.value;
};
var putOut=function(str){
  document.getElementById("console").innerHTML += str;
}
var getIn=function(){
  return form1.command.value;
}