'use strict';
var SEMS=[["First Year - Semester 1",[["OHS 101","Introduction to OHS",3,"B+"],["OHS 103","Hazard Identification and Risk Assessment",3,"B"],["OHS 105","Safety Management Principles",3,"B+"],["OHS 107","Communication Skills",2,"A-"],["GNS 101","Use of English",2,"B"]]],
["First Year - Semester 2",[["OHS 102","Occupational Hygiene",3,"B+"],["OHS 104","Ergonomics",3,"B"],["OHS 106","Workplace Safety and Health Regulations",3,"B+"],["OHS 108","Environmental Health and Safety",3,"B"],["ICT 101","Introduction to Information Technology",2,"A-"]]],
["First Year - Semester 3",[["OHS 109","Fire Safety and Emergency Response",3,"B+"],["OHS 111","Industrial Safety Management",3,"B"],["OHS 113","Health Promotion at Workplace",3,"B+"],["OHS 115","Safety Legislation and Compliance",3,"B"],["GNS 102","Entrepreneurship",2,"A-"]]],
["Third Year - Semester 1",[["OHS 301","Occupational Health Surveillance",3,"B+"],["OHS 303","Safety Auditing and Inspection",3,"B"],["OHS 305","Occupational Toxicology",3,"B+"],["OHS 307","Project Management in OHS",3,"B"],["OHS 309","Research Methods",2,"A-"]]],
["Third Year - Semester 2",[["OHS 302","Risk Management Strategies",3,"B+"],["OHS 304","Disaster Management and Preparedness",3,"B"],["OHS 306","Occupational Health Law",3,"B+"],["OHS 308","Advanced Ergonomics",3,"B"],["OHS 310","Seminar in OHS",2,"A-"]]],
["Third Year - Semester 3",[["OHS 311","Strategic Safety Management",3,"B+"],["OHS 313","Integrated Management Systems",3,"B"],["OHS 315","Occupational Health Economics",3,"B+"],["OHS 317","Applied Research Project",3,"B"],["OHS 319","Professional Practice in OHS",2,"A-"]]]];
var GP={"A":4,"A-":3.7,"B+":3.5,"B":3,"C+":2.5,"C":2,"D":1,"F":0},DESC={"A":"Excellent","A-":"Very good","B+":"Very good","B":"Good","C+":"Credit","C":"Satisfactory","D":"Pass","F":"Fail"};
var IC={dash:"M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",profile:"M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6",rec:"M2 9l10-5 10 5-10 5zM6 12v5c3 2 9 2 12 0v-5",reg:"M4 4h7v16H4zM13 4h7v16h-7z",time:"M4 5h16v16H4zM4 10h16M8 3v4M16 3v4",exam:"M6 3h12v18H6zM9 8h6M9 12h6M9 16h4",fin:"M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v10",msg:"M3 5h18v14H3zM3 6l9 7 9-7",lib:"M4 4h6c1 0 2 1 2 2v14c0-1-1-2-2-2H4zM20 4h-6c-1 0-2 1-2 2v14c0-1 1-2 2-2h6z",sup:"M4 14v-2a8 8 0 0116 0v2M4 14h3v5H4zM17 14h3v5h-3z"};
var NAV=[["dash","Dashboard","dash"],["profile","My Profile","profile"],["rec","Academic Records","rec"],["results","Results","",1],["trans","Transcripts","",1],["reg","Course Registration","reg"],["time","Timetable","time"],["exam","Examinations","exam"],["fin","Finance","fin"],["msg","Messages","msg"],["lib","Library","lib"],["sup","Support","sup"]];
var ANAV=[["students","Students","profile"],["ann","Announcements","msg"]];
var $=function(i){return document.getElementById(i)};
var db=null,user=null,uid=null,isAdmin=false,role=null,sid=null,me=null,stu=[],news=[],view="dash",open=true,editing=null,flash="",unsubs=[],ready=false;
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function key(id){return String(id).trim().toUpperCase().replace(/[^A-Z0-9]/g,"_")}
function all(){var a=[];SEMS.forEach(function(s){a=a.concat(s[1])});return a}
function calc(list,g){var cr=0,pts=0;list.forEach(function(c){var x=g[c[0]];if(x){cr+=c[2];pts+=c[2]*GP[x]}});return{cr:cr,pts:pts,gpa:cr?pts/cr:0}}
function ico(k){return'<svg viewBox="0 0 24 24"><path d="'+IC[k]+'"/></svg>'}
function msg(t){$("err").textContent=t||""}
function stuBy(k){return stu.filter(function(s){return s.sid===k})[0]}
function sample(){var g={};all().forEach(function(c){g[c[0]]=c[3]});return g}
/* ---- student views ---- */
function infoCard(p){function f(l,v,c){return'<div class="f"><span>'+l+'</span><b class="'+(c||'')+'">'+esc(v)+'</b></div>'}return'<div class="card info"><div>'+f("Student Name",p.name,"nm")+f("Student ID",p.id)+f("Programme",p.prog)+'</div><div>'+f("Level of Study",p.level)+f("Department",p.dept)+'</div><div>'+f("Academic Status","Active","ok")+f("Academic Year",p.year)+'</div></div>'}
function gpaCard(g){var t=calc(all(),g),C=2*Math.PI*60,d=C*t.gpa/4,stand=!t.cr?"No grades yet":t.gpa>=2?"Good standing":"Academic warning";
return'<div class="card side"><div class="bar">GPA SUMMARY</div><svg class="ring" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Cumulative GPA '+t.gpa.toFixed(2)+'"><circle cx="80" cy="80" r="60" fill="none" stroke="var(--line)" stroke-width="12"/><circle cx="80" cy="80" r="60" fill="none" stroke="var(--or)" stroke-width="12" stroke-linecap="round" stroke-dasharray="'+d+' '+C+'" transform="rotate(-90 80 80)"/><text x="80" y="82" text-anchor="middle" font-size="34" font-weight="800" fill="currentColor">'+t.gpa.toFixed(2)+'</text><text x="80" y="102" text-anchor="middle" font-size="11" fill="var(--mute)">Cumulative GPA</text></svg><div class="kv"><span>Total credit hours earned</span><b>'+t.cr+'</b></div><div class="kv"><span>Total grade points</span><b>'+t.pts.toFixed(2)+'</b></div><div class="kv"><span>Academic standing</span><b>'+stand+'</b></div></div>'}
function scaleCard(){return'<div class="card side"><div class="bar">GRADE SCALE</div><table><tr><th>Grade</th><th>Grade point</th><th>Description</th></tr>'+Object.keys(GP).map(function(k){return'<tr><td>'+k+'</td><td>'+GP[k].toFixed(2)+'</td><td>'+DESC[k]+'</td></tr>'}).join("")+'</table></div>'}
function semCard(s,g){var t=calc(s[1],g);
return'<div class="card sem"><h3>'+s[0]+'</h3><div class="wrap"><table><tr><th>Code</th><th>Course title</th><th>Cr.Hrs</th><th>Grade</th><th>GP</th></tr>'+s[1].map(function(c){var x=g[c[0]];return'<tr><td>'+c[0]+'</td><td>'+c[1]+'</td><td>'+c[2]+'</td><td>'+(x||"--")+'</td><td>'+(x?GP[x].toFixed(2):"--")+'</td></tr>'}).join("")+'</table></div><div class="sf"><span>Semester GPA: '+t.gpa.toFixed(2)+'</span><span>Total Cr.Hrs: '+t.cr+'</span></div></div>'}
function newsHtml(){return news.length?news.map(function(n){return'<div class="ann"><b>'+esc(n.title)+'</b><div style="color:var(--mute)">'+esc(n.body)+'</div></div>'}).join(""):'<div class="empty"><b>No announcements</b>Your administrator has not posted anything yet.</div>'}
function sView(){
if(!me)return'<div class="card"><div class="empty"><b>Record not found</b>Your student record was removed. Contact your administrator.</div></div>';
var g=me.grades||{},v=view;
if(v==="dash")return infoCard(me)+'<div class="cols"><div class="card"><h2>Announcements</h2>'+newsHtml()+'</div><div>'+gpaCard(g)+'</div></div>';
if(v==="profile")return infoCard(me)+'<p style="color:var(--mute)">Your administrator maintains these details.</p>';
if(v==="results"||v==="trans")return infoCard(me)+'<h2>Academic Results</h2><div class="cols"><div class="sems">'+SEMS.map(function(s){return semCard(s,g)}).join("")+'</div><div>'+gpaCard(g)+scaleCard()+'</div></div>';
if(v==="msg")return'<div class="card"><h2>Messages</h2>'+newsHtml()+'</div>';
var n=NAV.filter(function(x){return x[0]===v})[0];return'<div class="card"><h2>'+n[1]+'</h2><div class="empty"><b>Nothing here yet</b>Your administrator has not added anything to this page.</div></div>'}
/* ---- admin views ---- */
function aView(){
var fl=flash?'<div class="flash">'+esc(flash)+'</div>':"";
if(view==="ann")return fl+'<div class="card"><h2>Post an announcement</h2><label class="fld"><span>Title</span><input id="at"></label><label class="fld"><span>Message</span><textarea id="ab" rows="3"></textarea></label><button class="btn" id="apost">Post announcement</button></div><div class="card"><h2>Posted</h2>'+(news.length?news.map(function(n){return'<div class="ann"><b>'+esc(n.title)+'</b> <button class="mini" data-dann="'+n.id+'">Delete</button><div style="color:var(--mute)">'+esc(n.body)+'</div></div>'}).join(""):'<div class="empty"><b>No announcements</b>Posts appear on every student dashboard.</div>')+'</div>';
if(editing!==null)return editForm();
return fl+'<div class="card"><h2>Students</h2><div class="bt" style="margin:0 0 12px"><button class="btn" data-edit="new">Add student</button>'+''+'</div>'
+(stu.length?'<div class="wrap"><table><tr><th>Name</th><th>Student ID</th><th>Programme</th><th>Level</th><th>GPA</th><th></th></tr>'+stu.map(function(s){return'<tr><td>'+esc(s.name)+'</td><td>'+esc(s.id)+'</td><td>'+esc(s.prog)+'</td><td>'+esc(s.level)+'</td><td>'+calc(all(),s.grades||{}).gpa.toFixed(2)+'</td><td style="white-space:nowrap"><button class="mini" data-edit="'+s.sid+'">Edit</button> <button class="mini" data-del="'+s.sid+'">Delete</button></td></tr>'}).join("")+'</table></div>':'<div class="empty"><b>No students yet</b>Add a student to create their record and access code.</div>')+'</div>'}
function editForm(){var neu=editing==="new",o=neu?{}:(stuBy(editing)||{}),g=o.grades||{};
var f=[["name","Full name"],["id","Student ID"],["prog","Programme"],["dept","Department"],["level","Level of study"],["year","Academic year"]];
return(flash?'<div class="flash">'+esc(flash)+'</div>':"")+'<div class="card"><h2>'+(neu?"Add student":"Edit "+esc(o.name))+'</h2><div class="form">'+f.map(function(x){return'<label class="fld"><span>'+x[1]+'</span><input data-p="'+x[0]+'" value="'+esc(o[x[0]]||"")+'"'+(x[0]==="id"&&!neu?' disabled':'')+'></label>'}).join("")+'</div></div>'
+'<div class="sems">'+SEMS.map(function(s){return'<div class="card sem"><h3>'+s[0]+'</h3><table>'+s[1].map(function(c){return'<tr><td>'+c[0]+'</td><td>'+c[1]+'</td><td><select data-c="'+c[0]+'"><option value="">--</option>'+Object.keys(GP).map(function(k){return'<option'+(g[c[0]]===k?' selected':'')+'>'+k+'</option>'}).join("")+'</select></td></tr>'}).join("")+'</table></div>'}).join("")+'</div>'
+'<div class="bt"><button class="btn" id="save">Save student</button><button class="btn alt" id="cancel">Cancel</button>'+(neu?'':'<button class="btn alt" id="rcode">Reset access code</button>')+'</div>'}

/* ---- api and session ---- */
async function api(m,u,b){var r=await fetch("/api"+u,{method:m,headers:b?{"Content-Type":"application/json"}:{},body:b?JSON.stringify(b):undefined,credentials:"same-origin"});var j=null;try{j=await r.json()}catch(e){}if(!r.ok)throw new Error((j&&j.error)||"Request failed");return j}
function tab(a){$("p-s").hidden=a;$("p-a").hidden=!a;$("t-s").setAttribute("aria-pressed",!a);$("t-a").setAttribute("aria-pressed",a);msg("")}
async function sLogin(){msg("");var id=$("sid").value.trim(),c=$("scode").value.trim();if(!id||!c)return msg("Enter your student ID and access code.");
try{await api("POST","/student/login",{id:id,code:c});$("scode").value="";await boot()}catch(e){msg(e.message)}}
async function aLogin(){msg("");if(!$("apw").value)return msg("Enter the administrator password.");
try{await api("POST","/admin/login",{password:$("apw").value});$("apw").value="";await boot()}catch(e){msg(e.message)}}
async function boot(){var m=await api("GET","/me");role=m.role;sid=m.sid;view=role==="admin"?"students":"dash";editing=null;flash="";await refresh();clearInterval(timer);timer=setInterval(refresh,30000)}
var timer;
async function refresh(){try{if(role==="admin")stu=(await api("GET","/students")).students;else if(role==="student")me=(await api("GET","/student")).student;if(role)news=(await api("GET","/announcements")).items}catch(e){if(/session/i.test(e.message)){role=null;clearInterval(timer);msg("Your session has expired. Please sign in again.")}}soft()}
function soft(){var a=document.activeElement;if(role&&a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;if(role==="admin"&&editing!==null)return;render()}
async function logout(){try{await api("POST","/logout")}catch(e){}clearInterval(timer);role=null;sid=null;me=null;stu=[];news=[];editing=null;flash="";render()}
function act(p,ok){return p.then(function(){flash=ok;return refresh()}).catch(function(e){flash="Failed: "+e.message;render()})}
async function save(){var p={};document.querySelectorAll("[data-p]").forEach(function(i){p[i.dataset.p]=i.value.trim()});
var neu=editing==="new",o=neu?null:stuBy(editing);if(!neu)p.id=o.id;
if(!p.name||!p.id){flash="Name and student ID are required.";return render()}
var g={};document.querySelectorAll("[data-c]").forEach(function(s){if(s.value)g[s.dataset.c]=s.value});
try{var r=neu?await api("POST","/students",{profile:p,grades:g}):await api("PUT","/students/"+editing,{profile:p,grades:g});
flash=r.code?"Saved. Access code for "+p.name+": "+r.code+". It is shown only once, so share it with the student now.":"Saved.";editing=null;await refresh()}catch(e){flash="Could not save: "+e.message}render()}
async function newCode(k){var o=stuBy(k);try{var r=await api("POST","/students/"+k+"/code");flash="New access code for "+o.name+": "+r.code+". The old code no longer works.";editing=null}catch(e){flash="Could not reset: "+e.message}render()}
/* ---- shell ---- */
function render(){
var login=!role;$("login").hidden=!login;$("app").hidden=login;
if(login){$("lnote").textContent=ready?"":"Loading...";return}
var isA=role==="admin",nav=isA?ANAV:NAV;
$("ttl").textContent=isA?"Admin Console":"Student Portal";$("bell").hidden=isA;
$("nav").innerHTML=nav.map(function(n){if(n[3]&&!open)return"";var cur=view===n[0]?' aria-current="page"':"";
if(n[0]==="rec")return'<button data-tog="1">'+ico("rec")+n[1]+'<svg class="chev" style="transform:rotate('+(open?180:0)+'deg)" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>';
return'<button class="'+(n[3]?'sub':'')+'" data-go="'+n[0]+'"'+cur+'>'+(n[3]?'':ico(n[2]))+n[1]+'</button>'}).join("");
var b=$("badge");b.textContent=news.length;b.style.display=news.length?"block":"none";
$("view").innerHTML=isA?aView():sView();
$("date").textContent=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}
function go(v){view=v;editing=null;flash="";$("side").classList.remove("open");$("scrim").classList.remove("on");render();window.scrollTo(0,0)}
document.addEventListener("click",function(e){var t=e.target.closest("button");if(!t)return;var d=t.dataset,i=t.id;
if(i==="t-s")tab(false);else if(i==="t-a")tab(true);else if(i==="sgo")sLogin();else if(i==="ago")aLogin();
else if(i==="out")logout();else if(i==="bell")go("msg");else if(i==="burger"){var o=$("side").classList.toggle("open");$("scrim").classList.toggle("on",o)}
else if(d.go)go(d.go);else if(d.tog){open=!open;render()}
else if(d.edit){editing=d.edit;flash="";render()}
else if(d.del){if(confirm("Delete this student record?"))act(api("DELETE","/students/"+d.del),"Student deleted.")}
else if(i==="save")save();else if(i==="cancel"){editing=null;render()}else if(i==="rcode")newCode(editing);
else if(i==="apost"){var ti=$("at").value.trim(),bo=$("ab").value.trim();if(ti)act(api("POST","/announcements",{title:ti,body:bo}),"Announcement posted.")}
else if(d.dann)act(api("DELETE","/announcements/"+d.dann),"Announcement deleted.")});
document.addEventListener("keydown",function(e){if(e.key!=="Enter")return;if(e.target.id==="sid"||e.target.id==="scode")sLogin();else if(e.target.id==="apw")aLogin()});
$("scrim").addEventListener("click",function(){$("side").classList.remove("open");$("scrim").classList.remove("on")});
render();
(async function(){try{var m=await api("GET","/me");if(m.role)await boot()}catch(e){}ready=true;render()})();
