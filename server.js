const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto"),url=require("url");
const PORT=process.env.PORT||3000;
const ADMIN_USER=process.env.ADMIN_USER||"ADMIN";
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD;
if(!ADMIN_PASSWORD){console.error("Set ADMIN_PASSWORD environment variable before starting.");process.exit(1);}
const DATA=path.join(__dirname,"data.json");
const sessions=new Map();

function hash(p,s=crypto.randomBytes(16).toString("hex")){return {s,h:crypto.scryptSync(p,s,64).toString("hex")}}
function verify(p,x){try{return crypto.timingSafeEqual(Buffer.from(x.h,"hex"),crypto.scryptSync(p,x.s,64))}catch{return false}}
function load(){if(!fs.existsSync(DATA)){let users={};for(let i=1;i<=999;i++){let q=hash("789789");users["XIAOQUANSAIMA"+i]={password:q,balance:0,totalBet:0,totalReturn:0,totalLoss:0,history:[]}}let d={users,logs:[]};fs.writeFileSync(DATA,JSON.stringify(d,null,2));return d}return JSON.parse(fs.readFileSync(DATA,"utf8"))}
function save(d){fs.writeFileSync(DATA,JSON.stringify(d,null,2))}
let db=load();
function body(req){return new Promise((res,rej)=>{let b="";req.on("data",c=>b+=c);req.on("end",()=>{try{res(b?JSON.parse(b):{})}catch{rej(new Error("JSON错误"))}})})}
function send(res,code,obj){res.writeHead(code,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(obj))}
function auth(req,admin=false){let t=(req.headers.authorization||"").replace("Bearer ",""),s=sessions.get(t);if(!s||s.expires<Date.now()||s.admin!==admin)return null;return s}
function token(admin,user){let t=crypto.randomBytes(32).toString("hex");sessions.set(t,{admin,user,expires:Date.now()+86400000});return t}
function userSafe(u){return {balance:u.balance,totalBet:u.totalBet,totalReturn:u.totalReturn,totalLoss:u.totalLoss,history:u.history||[]}}
async function main(req,res){
try{
 let u=url.parse(req.url,true),p=u.pathname;
 if(req.method==="POST"&&p==="/api/login"){let b=await body(req),name=(b.username||"").trim().toUpperCase(),x=db.users[name];if(!x||!verify(b.password||"",x.password))return send(res,401,{error:"账号或密码错误"});return send(res,200,{token:token(false,name),username:name})}
 if(req.method==="POST"&&p==="/api/admin/login"){let b=await body(req);if(b.username!==ADMIN_USER||b.password!==ADMIN_PASSWORD)return send(res,401,{error:"管理员账号或密码错误"});return send(res,200,{token:token(true,ADMIN_USER)})}
 let s=auth(req,false);
 if(req.method==="GET"&&p==="/api/me"){if(!s)return send(res,401,{error:"登录已过期"});return send(res,200,userSafe(db.users[s.user]))}
 if(req.method==="POST"&&p==="/api/password"){if(!s)return send(res,401,{error:"登录已过期"});let b=await body(req),x=db.users[s.user];if(!verify(b.oldPassword||"",x.password))return send(res,400,{error:"旧密码错误"});if(!b.newPassword||b.newPassword.length<6)return send(res,400,{error:"新密码至少6位"});x.password=hash(b.newPassword);save(db);return send(res,200,{ok:true})}
 if(req.method==="POST"&&p==="/api/bet"){if(!s)return send(res,401,{error:"登录已过期"});let b=await body(req),n=Number(b.amount),x=db.users[s.user];if(!(n>0)||n>x.balance)return send(res,400,{error:"虚拟余额不足"});x.balance-=n;x.totalBet+=n;save(db);return send(res,200,{balance:x.balance})}
 if(req.method==="POST"&&p==="/api/race-finish"){if(!s)return send(res,401,{error:"登录已过期"});let b=await body(req),x=db.users[s.user],stake=Number(b.stake)||0,ret=Number(b.returnAmount)||0,total=Number(b.total)||0,won=stake>0;x.balance+=ret;x.totalReturn+=ret;x.totalLoss+=won?Math.max(0,total-ret):total;x.history.push({time:new Date().toLocaleString("zh-CN"),winner:b.winner,total,result:b.result,balance:x.balance});x.history=x.history.slice(-50);save(db);return send(res,200,{balance:x.balance})}
 let a=auth(req,true);
 if(req.method==="GET"&&p==="/api/admin/customer"){if(!a)return send(res,401,{error:"管理员登录已过期"});let name=(u.query.username||"").toUpperCase(),x=db.users[name];if(!x)return send(res,404,{error:"顾客账号不存在"});return send(res,200,{username:name,balance:x.balance})}
 if(req.method==="POST"&&p==="/api/admin/adjust"){if(!a)return send(res,401,{error:"管理员登录已过期"});let b=await body(req),name=(b.username||"").trim().toUpperCase(),n=Number(b.amount),x=db.users[name];if(!x)return send(res,404,{error:"顾客账号不存在"});if(!Number.isFinite(n)||n===0)return send(res,400,{error:"请输入有效金额"});if(n<0&&-n>x.balance)return send(res,400,{error:"不能扣除超过当前余额的金额"});x.balance+=n;db.logs.push({time:new Date().toLocaleString("zh-CN"),user:name,change:(n>0?"+":"")+"RM"+n.toFixed(2),reason:b.reason||"后台余额调整",balance:x.balance});db.logs=db.logs.slice(-200);save(db);return send(res,200,{balance:x.balance})}
 if(req.method==="GET"&&p==="/api/admin/logs"){if(!a)return send(res,401,{error:"管理员登录已过期"});return send(res,200,{logs:db.logs})}
 if(req.method==="GET"){let f=p==="/"?"index.html":p.replace(/^\/+/,""),file=path.join(__dirname,"public",f);if(!file.startsWith(path.join(__dirname,"public")))return send(res,403,{error:"禁止访问"});if(fs.existsSync(file)){let ext=path.extname(file),ct=ext===".html"?"text/html; charset=utf-8":ext===".js"?"text/javascript":"text/plain";res.writeHead(200,{"Content-Type":ct});return res.end(fs.readFileSync(file))}}
 send(res,404,{error:"Not found"});
}catch(e){console.error(e);send(res,500,{error:"服务器错误"})}}
http.createServer(main).listen(PORT,()=>console.log("XIAOQUAN SAIMA cloud server listening on "+PORT));
