/* COM player for Infinite Dimensional Gomoku (alpha-beta minimax).
  Coordinates are arrays of integers. Missing dimensions are 0,
  so [1], [1,0] and [1,0,0] are the same place.
  color: 0=black, 1=white, -1=blank
*/
var AI_MAX_DEPTH = 8;   // max number of plies to search
var AI_TIME_MS   = 1000; // deeper search is not started/continued after this time
var AI_WIDTH = 10;  // number of candidate moves kept at each node
var AI_WIN   = 1e9; // score of a won game
// score of a 5-cell window that holds n stones of one color only
var AI_WEIGHT = [0, 0, 10, 100, 1000, 1000000];

var RESULT_NONE = 0; // the game goes on
var RESULT_WIN  = 1; // the mover wins
var RESULT_LOSE = 2; // the mover loses (black overline)

var coordKey=function(c){
  var n=c.length;
  while(n>0 && c[n-1]==0) n--;
  return c.slice(0,n).join(",");
};
var coordAdd=function(a,dir,t){ // a + t*dir
  var n=Math.max(a.length,dir.length);
  var c=new Array(n);
  for(var d=0;d<n;d++) c[d]=(a[d]||0)+t*(dir[d]||0);
  return c;
};
/* alignment(a,b) returns {dir,k} with b = a + k*dir,
  dir in {-1,0,1}^n \ {0}, or null if a and b are not on one line. */
var alignment=function(a,b){
  var n=Math.max(a.length,b.length);
  var k=0;
  var dir=new Array(n);
  for(var d=0;d<n;d++){
    var diff=(b[d]||0)-(a[d]||0);
    if(diff!=0){
      var ad=Math.abs(diff);
      if(k==0) k=ad;
      else if(ad!=k) return null;
    }
    dir[d]=diff;
  }
  if(k==0) return null;
  for(var d=0;d<n;d++) dir[d]/=k;
  return {dir:dir, k:k};
};
// sign-normalized direction: the first nonzero element is positive
var normalizeDir=function(dir){
  for(var d=0;d<dir.length;d++){
    if(dir[d]>0) return dir;
    if(dir[d]<0) return dir.map(function(x){return -x;});
  }
  return dir;
};
// score of one window (black minus white)
var windowScore=function(b,w){
  if(b>0 && w>0) return 0;
  if(b>0) return  AI_WEIGHT[b];
  return -AI_WEIGHT[w];
};

//-------------------------------------------
var Board=function(stonelist){
  this.map=new Map();     // coordKey -> color
  this.stones=[[],[]];    // stones[p] = list of coordinates
  this.history=[];        // stack of {key,p,delta}
  this.score=0;           // sum of windowScore over all windows
  for(var p=0;p<2;p++){
    for(var s=0;s<stonelist[p].length;s++) this.place(stonelist[p][s],p);
  }
};
Board.prototype.get=function(c){
  var v=this.map.get(coordKey(c));
  return (v===undefined)?-1:v;
};
/* directions from m to stones (of color q, or any if q<0)
  within distance maxDist. Each line is listed once. */
Board.prototype.dirsFrom=function(m,maxDist,q){
  var seen=new Set();
  var dirs=[];
  for(var p=0;p<2;p++){
    if(q>=0 && p!=q) continue;
    var st=this.stones[p];
    for(var s=0;s<st.length;s++){
      var al=alignment(m,st[s]);
      if(al==null || al.k>maxDist) continue;
      var dir=normalizeDir(al.dir);
      var key=coordKey(dir);
      if(seen.has(key)) continue;
      seen.add(key);
      dirs.push(dir);
    }
  }
  return dirs;
};
/* change of this.score when color p is put on the blank place m.
  Only windows holding m and another stone change their score. */
Board.prototype.deltaFor=function(m,p){
  var dirs=this.dirsFrom(m,4,-1);
  var delta=0;
  var col=new Array(9);
  for(var i=0;i<dirs.length;i++){
    for(var t=-4;t<=4;t++) col[t+4]=(t==0)?-1:this.get(coordAdd(m,dirs[i],t));
    for(var start=0;start<=4;start++){
      var b=0,w=0;
      for(var j=start;j<start+5;j++){
        if(col[j]==0) b++;
        else if(col[j]==1) w++;
      }
      var before=windowScore(b,w);
      var after =(p==0)?windowScore(b+1,w):windowScore(b,w+1);
      delta+=after-before;
    }
  }
  return delta;
};
Board.prototype.place=function(c,p){
  var key=coordKey(c);
  var delta=this.deltaFor(c,p);
  this.map.set(key,p);
  this.stones[p].push(c);
  this.history.push({key:key,p:p,delta:delta});
  this.score+=delta;
};
Board.prototype.undo=function(){
  var h=this.history.pop();
  this.map.delete(h.key);
  this.stones[h.p].pop();
  this.score-=h.delta;
};
// number of stones of color p from m (excluded) to the direction t*dir
Board.prototype.runLength=function(m,dir,t,p){
  var c=0;
  for(var x=1;;x++){
    if(this.get(coordAdd(m,dir,t*x))!=p) return c;
    c++;
  }
};
/* result after color p was put on m.
  black: exactly 5 wins, 6 or more loses (exactly 5 has priority).
  white: 5 or more wins. */
Board.prototype.result=function(m,p){
  var five=false, over=false;
  var dirs=this.dirsFrom(m,1,p);
  for(var i=0;i<dirs.length;i++){
    var run=1+this.runLength(m,dirs[i],+1,p)+this.runLength(m,dirs[i],-1,p);
    if(run==5) five=true;
    else if(run>5) over=true;
  }
  if(p==1) return (five||over)?RESULT_WIN:RESULT_NONE;
  if(five) return RESULT_WIN;
  if(over) return RESULT_LOSE;
  return RESULT_NONE;
};
Board.prototype.maxDims=function(){
  var n=0;
  for(var p=0;p<2;p++){
    for(var s=0;s<this.stones[p].length;s++){
      var c=this.stones[p][s];
      var len=c.length;
      while(len>0 && c[len-1]==0) len--;
      if(n<len) n=len;
    }
  }
  return n;
};
/* candidate moves:
  - axis neighbours of every stone (one unused dimension is also tried)
  - blank places in 5-cell windows through two stones of one color */
Board.prototype.candidates=function(){
  var self=this;
  var cand=new Map();
  var add=function(c){
    var key=coordKey(c);
    if(self.map.has(key) || cand.has(key)) return;
    cand.set(key,c);
  };
  var D=this.maxDims();
  for(var p=0;p<2;p++){
    var st=this.stones[p];
    for(var s=0;s<st.length;s++){
      for(var d=0;d<=D;d++){
        for(var sign=-1;sign<=1;sign+=2){
          if(d==D && sign<0) continue; // -1 and +1 are symmetric in an unused dimension
          var c=st[s].slice();
          while(c.length<=d) c.push(0);
          c[d]+=sign;
          add(c);
        }
      }
    }
    for(var i=0;i<st.length;i++){
      for(var j=i+1;j<st.length;j++){
        var al=alignment(st[i],st[j]);
        if(al==null || al.k>4) continue;
        for(var t=al.k-4;t<=4;t++) add(coordAdd(st[i],al.dir,t));
      }
    }
  }
  return Array.from(cand.values());
};
// candidates sorted by priority for color p, at most AI_WIDTH moves
Board.prototype.orderedMoves=function(p){
  var sgn=(p==0)?1:-1;
  var list=[];
  var cand=this.candidates();
  for(var i=0;i<cand.length;i++){
    var own  = sgn*this.deltaFor(cand[i],p);   // gain of p
    var block=-sgn*this.deltaFor(cand[i],1-p); // gain of the opponent if it takes the place
    list.push({c:cand[i], v:own+block});
  }
  list.sort(function(a,b){return b.v-a.v;});
  return list.slice(0,AI_WIDTH);
};
// negamax with alpha-beta pruning. returns the score for color p.
var AI_TIMEOUT = {}; // thrown when the time is up
Board.prototype.search=function(depth,alpha,beta,p){
  if(this.deadline && Date.now()>this.deadline) throw AI_TIMEOUT;
  if(depth==0) return (p==0)?this.score:-this.score;
  var moves=this.orderedMoves(p);
  if(moves.length==0) return (p==0)?this.score:-this.score;
  var best=-Infinity;
  for(var i=0;i<moves.length;i++){
    var v=this.moveValue(moves[i].c,depth,alpha,beta,p);
    if(v>best) best=v;
    if(v>alpha) alpha=v;
    if(alpha>=beta) break;
  }
  return best;
};
Board.prototype.moveValue=function(c,depth,alpha,beta,p){
  this.place(c,p);
  var r=this.result(c,p);
  var v;
  if(r==RESULT_WIN)       v= AI_WIN+depth; // a faster win is better
  else if(r==RESULT_LOSE) v=-AI_WIN-depth;
  else v=-this.search(depth-1,-beta,-alpha,1-p);
  this.undo();
  return v;
};
/* returns the move of COM (color p) as a coordinate array.
  iterative deepening: search depth 1,2,3,... and use the result
  of the deepest search finished within AI_TIME_MS. */
var comChooseMove=function(stonelist,p){
  var board=new Board(stonelist);
  var moves=board.orderedMoves(p);
  var best=moves[0].c;
  board.deadline=Date.now()+AI_TIME_MS;
  for(var depth=1;depth<=AI_MAX_DEPTH;depth++){
    var dbest=null, bestv=-Infinity, alpha=-Infinity;
    try{
      for(var i=0;i<moves.length;i++){
        var v=board.moveValue(moves[i].c,depth,alpha,Infinity,p);
        if(v>bestv){ bestv=v; dbest=moves[i]; }
        if(v>alpha) alpha=v;
      }
    }catch(e){
      if(e!==AI_TIMEOUT) throw e;
      break; // the search of this depth is not finished
    }
    best=dbest.c;
    if(bestv>=AI_WIN || bestv<=-AI_WIN) break; // the result is decided
    // search the best move first at the next depth
    moves.splice(moves.indexOf(dbest),1);
    moves.unshift(dbest);
  }
  var key=coordKey(best);
  return key=="" ? [0] : key.split(",").map(Number);
};
// returns RESULT_* after color p was put on m (m is already in stonelist)
var judgeMove=function(stonelist,m,p){
  return new Board(stonelist).result(m,p);
};
if(typeof module!=="undefined") module.exports={Board:Board,comChooseMove:comChooseMove,judgeMove:judgeMove,
  RESULT_NONE:RESULT_NONE,RESULT_WIN:RESULT_WIN,RESULT_LOSE:RESULT_LOSE};
