'use strict';
var SEMS=[["First Year - Semester 1",[["OHS 101","Introduction to OHS",3,"B+"],["OHS 103","Hazard Identification and Risk Assessment",3,"B"],["OHS 105","Safety Management Principles",3,"B+"],["OHS 107","Communication Skills",2,"A-"],["GNS 101","Use of English",2,"B"]]],
["First Year - Semester 2",[["OHS 102","Occupational Hygiene",3,"B+"],["OHS 104","Ergonomics",3,"B"],["OHS 106","Workplace Safety and Health Regulations",3,"B+"],["OHS 108","Environmental Health and Safety",3,"B"],["ICT 101","Introduction to Information Technology",2,"A-"]]],
["First Year - Semester 3",[["OHS 109","Fire Safety and Emergency Response",3,"B+"],["OHS 111","Industrial Safety Management",3,"B"],["OHS 113","Health Promotion at Workplace",3,"B+"],["OHS 115","Safety Legislation and Compliance",3,"B"],["GNS 102","Entrepreneurship",2,"A-"]]],
["Third Year - Semester 1",[["OHS 301","Occupational Health Surveillance",3,"B+"],["OHS 303","Safety Auditing and Inspection",3,"B"],["OHS 305","Occupational Toxicology",3,"B+"],["OHS 307","Project Management in OHS",3,"B"],["OHS 309","Research Methods",2,"A-"]]],
["Third Year - Semester 2",[["OHS 302","Risk Management Strategies",3,"B+"],["OHS 304","Disaster Management and Preparedness",3,"B"],["OHS 306","Occupational Health Law",3,"B+"],["OHS 308","Advanced Ergonomics",3,"B"],["OHS 310","Seminar in OHS",2,"A-"]]],
["Third Year - Semester 3",[["OHS 311","Strategic Safety Management",3,"B+"],["OHS 313","Integrated Management Systems",3,"B"],["OHS 315","Occupational Health Economics",3,"B+"],["OHS 317","Applied Research Project",3,"B"],["OHS 319","Professional Practice in OHS",2,"A-"]]]];
var GP={"A":4,"A-":3.7,"B+":3.5,"B":3,"C+":2.5,"C":2,"D":1,"F":0},DESC={"A":"Excellent","A-":"Very good","B+":"Very good","B":"Good","C+":"Credit","C":"Satisfactory","D":"Pass","F":"Fail"};
var IC={dash:"M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",profile:"M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6",rec:"M2 9l10-5 10 5-10 5zM6 12v5c3 2 9 2 12 0v-5",reg:"M4 4h7v16H4zM13 4h7v16h-7z",time:"M4 5h16v16H4zM4 10h16M8 3v4M16 3v4",exam:"M6 3h12v18H6zM9 8h6M9 12h6M9 16h4",fin:"M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v10",msg:"M3 5h18v14H3zM3 6l9 7 9-7",lib:"M4 4h6c1 0 2 1 2 2v14c0-1-1-2-2-2H4zM20 4h-6c-1 0-2 1-2 2v14c0-1 1-2 2-2h6z",sup:"M4 14v-2a8 8 0 0116 0v2M4 14h3v5H4zM17 14h3v5h-3z"};
var NAV=[["dash","Dashboard","dash"],["profile","My Profile","profile"],["rec","Academic Records","rec"],["results","Results","",1],["trans","Transcripts","",1],["time","Timetable","time"],["reg","Course Registration","reg"],["exam","Examinations","exam"],["fin","Finance","fin"],["msg","Messages","msg"],["lib","Library","lib"],["sup","Support","sup"]];
var ANAV=[["students","Students","profile"],["time","Timetable","time"],["reg","Course Registration","reg"],["ann","Announcements","msg"]];
var $=function(i){return document.getElementById(i)};
var db=null,user=null,uid=null,isAdmin=false,role=null,sid=null,me=null,stu=[],news=[],view="dash",open=true,editing=null,flash="",unsubs=[],ready=false;
var timetable=[],ttFilter="All",editingTt=null;
var regConfig={isOpen:true,semester:"2024/2025 - First Semester",minCredits:12,maxCredits:21,deadline:"October 30, 2026"};
var courses=[],myReg=null,adminRegs=[],editingCourse=null,adminRegTab="registrations",isEditingStudentReg=false;
var selectedRegCodes=[];
var DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
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
function downloadBlob(content, mimeType, filename){
  var blob = new Blob([content], { type: mimeType });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
}

function downloadDoc(student, isTranscript){
  var p = student;
  var g = p.grades || {};
  var t = calc(all(), g);
  var docTitle = isTranscript ? "Official Academic Transcript" : "Semester Results Slip";
  var docSubtitle = isTranscript ? "OFFICIAL ACADEMIC TRANSCRIPT" : "STATEMENT OF EXAMINATION RESULTS";
  var dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  var docRef = "EGI-" + (isTranscript ? "TRN" : "RES") + "-" + Date.now().toString().slice(-6);

  var html = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n'
    + '<title>' + esc(docTitle) + ' - ' + esc(p.name) + ' (' + esc(p.id) + ')</title>\n'
    + '<style>\n'
    + '@page { size: A4; margin: 15mm; }\n'
    + 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 24px; background: #f8f9fa; line-height: 1.4; }\n'
    + '.sheet { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #ddd; padding: 40px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }\n'
    + '.no-print { text-align: right; margin-bottom: 20px; }\n'
    + '.print-btn { background: #0f0f0f; color: #fff; border: 1px solid #f5a65b; border-radius: 6px; padding: 10px 18px; font-weight: bold; cursor: pointer; font-size: 14px; }\n'
    + '.header { text-align: center; border-bottom: 2px solid #0f0f0f; padding-bottom: 18px; margin-bottom: 22px; }\n'
    + '.inst-name { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f0f0f; margin: 0 0 4px; }\n'
    + '.inst-sub { font-size: 13px; color: #666; margin: 0 0 10px; }\n'
    + '.doc-badge { display: inline-block; background: #0f0f0f; color: #fff; padding: 5px 14px; font-weight: 800; font-size: 13px; letter-spacing: 1px; border-radius: 4px; }\n'
    + '.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; background: #fbfbfb; border: 1px solid #eee; border-radius: 6px; padding: 16px; margin-bottom: 24px; font-size: 13px; }\n'
    + '.meta-row span { color: #666; display: block; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }\n'
    + '.meta-row b { font-size: 14px; color: #000; }\n'
    + '.sem-sec { margin-bottom: 20px; }\n'
    + '.sem-title { font-size: 13px; font-weight: 800; text-transform: uppercase; background: #f2f2f2; padding: 6px 10px; border-left: 4px solid #f5a65b; margin: 0 0 8px; }\n'
    + 'table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }\n'
    + 'th { background: #fafafa; border-bottom: 2px solid #ddd; text-align: left; padding: 6px 8px; font-weight: 700; }\n'
    + 'td { border-bottom: 1px solid #eee; padding: 6px 8px; }\n'
    + '.text-right { text-align: right; }\n'
    + '.sem-foot { display: flex; justify-content: space-between; font-weight: 700; font-size: 12px; padding: 4px 8px; background: #fafafa; border-radius: 4px; }\n'
    + '.summary-box { background: #0f0f0f; color: #fff; border-radius: 6px; padding: 16px; margin: 24px 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center; }\n'
    + '.summary-item span { display: block; font-size: 11px; color: #bbb; margin-bottom: 4px; }\n'
    + '.summary-item b { font-size: 18px; color: #fff; }\n'
    + '.summary-item b.highlight { color: #f5a65b; }\n'
    + '.auth-sec { margin-top: 36px; padding-top: 20px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 12px; }\n'
    + '.auth-col { width: 45%; }\n'
    + '.sig-line { border-bottom: 1px dashed #999; margin: 36px 0 6px; }\n'
    + '@media print {\n'
    + '  body { background: #fff; padding: 0; }\n'
    + '  .sheet { border: none; box-shadow: none; padding: 0; max-width: 100%; }\n'
    + '  .no-print { display: none !important; }\n'
    + '  .sem-sec { break-inside: avoid; }\n'
    + '}\n'
    + '</style>\n</head>\n<body>\n'
    + '<div class="sheet">\n'
    + '<div class="no-print"><button class="print-btn" onclick="window.print()">Print / Save as PDF</button></div>\n'
    + '<div class="header">\n'
    + '<div class="inst-name">eLearning Group Institute</div>\n'
    + '<div class="inst-sub">Office of Academic Affairs &bull; Student Records &amp; Examination Directorate</div>\n'
    + '<div class="doc-badge">' + esc(docSubtitle) + '</div>\n'
    + '</div>\n'
    + '<div class="meta-grid">\n'
    + '<div class="meta-row"><span>Student Full Name</span><b>' + esc(p.name) + '</b></div>\n'
    + '<div class="meta-row"><span>Student ID</span><b>' + esc(p.id) + '</b></div>\n'
    + '<div class="meta-row"><span>Programme of Study</span><b>' + esc(p.prog || 'Not specified') + '</b></div>\n'
    + '<div class="meta-row"><span>Faculty / Department</span><b>' + esc(p.dept || 'Not specified') + '</b></div>\n'
    + '<div class="meta-row"><span>Level of Study</span><b>' + esc(p.level || 'Not specified') + '</b></div>\n'
    + '<div class="meta-row"><span>Academic Year</span><b>' + esc(p.year || '2024/2025') + '</b></div>\n'
    + '<div class="meta-row"><span>Date Issued</span><b>' + esc(dateStr) + '</b></div>\n'
    + '<div class="meta-row"><span>Reference ID</span><b>' + esc(docRef) + '</b></div>\n'
    + '</div>\n';

  SEMS.forEach(function(s) {
    var semCalc = calc(s[1], g);
    html += '<div class="sem-sec"><div class="sem-title">' + esc(s[0]) + '</div>\n'
      + '<table><thead><tr><th>Code</th><th>Course Title</th><th class="text-right">Credit Hours</th><th class="text-right">Grade</th><th class="text-right">Grade Point</th></tr></thead><tbody>\n';
    s[1].forEach(function(c) {
      var x = g[c[0]];
      html += '<tr><td>' + esc(c[0]) + '</td><td>' + esc(c[1]) + '</td><td class="text-right">' + c[2] + '</td><td class="text-right"><b>' + esc(x || '--') + '</b></td><td class="text-right">' + (x ? GP[x].toFixed(2) : '--') + '</td></tr>\n';
    });
    html += '</tbody></table>\n'
      + '<div class="sem-foot"><span>Semester Credits: ' + semCalc.cr + '</span><span>Semester GPA: ' + semCalc.gpa.toFixed(2) + '</span></div></div>\n';
  });

  var standing = !t.cr ? "No grades recorded" : (t.gpa >= 3.6 ? "First Class Division" : (t.gpa >= 3.0 ? "Second Class Upper" : (t.gpa >= 2.0 ? "Good Standing" : "Academic Warning")));

  html += '<div class="summary-box">\n'
    + '<div class="summary-item"><span>Total Credit Hours</span><b>' + t.cr + '</b></div>\n'
    + '<div class="summary-item"><span>Total Grade Points</span><b>' + t.pts.toFixed(2) + '</b></div>\n'
    + '<div class="summary-item"><span>Cumulative GPA (CGPA)</span><b class="highlight">' + t.gpa.toFixed(2) + '</b></div>\n'
    + '<div class="summary-item"><span>Academic Status</span><b>' + esc(standing) + '</b></div>\n'
    + '</div>\n'
    + '<div class="auth-sec">\n'
    + '<div class="auth-col"><div><b>Grading Scale Key:</b></div><div style="font-size:11px;color:#666;margin-top:4px">A: 4.0 (Excellent), A-: 3.7 (Very Good), B+: 3.5 (Very Good), B: 3.0 (Good), C+: 2.5 (Credit), C: 2.0 (Satisfactory), D: 1.0 (Pass), F: 0.0 (Fail)</div></div>\n'
    + '<div class="auth-col" style="text-align:right">\n'
    + '<div class="sig-line"></div>\n'
    + '<b>Registrar / Academic Records Directorate</b>\n'
    + '<div style="font-size:11px;color:#666">Official Institutional Document &bull; ' + esc(docRef) + '</div>\n'
    + '</div>\n'
    + '</div>\n'
    + '</div>\n'
    + '</body>\n</html>';

  var filename = (isTranscript ? "Academic_Transcript_" : "Result_Slip_") + String(p.id).replace(/[^A-Za-z0-9]/g, "_") + ".html";
  downloadBlob(html, "text/html;charset=utf-8", filename);
}

function downloadCsv(student, isTranscript) {
  var p = student;
  var g = p.grades || {};
  var t = calc(all(), g);
  var csv = [];
  csv.push('"eLearning Group Institute - ' + (isTranscript ? 'Academic Transcript' : 'Result Slip') + '"');
  csv.push('"Student Name","' + (p.name || '').replace(/"/g, '""') + '"');
  csv.push('"Student ID","' + (p.id || '').replace(/"/g, '""') + '"');
  csv.push('"Programme","' + (p.prog || '').replace(/"/g, '""') + '"');
  csv.push('"Department","' + (p.dept || '').replace(/"/g, '""') + '"');
  csv.push('"Level","' + (p.level || '').replace(/"/g, '""') + '"');
  csv.push('"Academic Year","' + (p.year || '').replace(/"/g, '""') + '"');
  csv.push('"Date Issued","' + new Date().toISOString().split('T')[0] + '"');
  csv.push('');
  csv.push('"Semester","Course Code","Course Title","Credit Hours","Grade","Grade Point"');

  SEMS.forEach(function(s) {
    s[1].forEach(function(c) {
      var x = g[c[0]];
      csv.push('"' + s[0].replace(/"/g, '""') + '","' + c[0] + '","' + c[1].replace(/"/g, '""') + '",' + c[2] + ',"' + (x || '--') + '",' + (x ? GP[x].toFixed(2) : '--'));
    });
  });

  csv.push('');
  csv.push('"Cumulative GPA",' + t.gpa.toFixed(2));
  csv.push('"Total Credit Hours Earned",' + t.cr);
  csv.push('"Total Grade Points",' + t.pts.toFixed(2));

  var filename = (isTranscript ? "Academic_Transcript_" : "Results_") + String(p.id).replace(/[^A-Za-z0-9]/g, "_") + ".csv";
  downloadBlob(csv.join('\r\n'), "text/csv;charset=utf-8", filename);
}

function downloadTimetableDoc(items){
  var dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  var docRef = "EGI-TT-" + Date.now().toString().slice(-6);
  var sem = regConfig.semester || "2024/2025 Academic Session";

  var html = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n'
    + '<title>Academic Class Timetable - ' + esc(sem) + '</title>\n'
    + '<style>\n'
    + '@page { size: A4 portrait; margin: 12mm; }\n'
    + 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 20px; background: #f8f9fa; line-height: 1.4; }\n'
    + '.sheet { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #ddd; padding: 36px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }\n'
    + '.no-print { text-align: right; margin-bottom: 20px; }\n'
    + '.print-btn { background: #0f0f0f; color: #fff; border: 1px solid #f5a65b; border-radius: 6px; padding: 10px 18px; font-weight: bold; cursor: pointer; font-size: 14px; }\n'
    + '.header { text-align: center; border-bottom: 2px solid #0f0f0f; padding-bottom: 16px; margin-bottom: 20px; }\n'
    + '.inst-name { font-size: 22px; font-weight: 800; text-transform: uppercase; color: #0f0f0f; margin: 0 0 4px; }\n'
    + '.inst-sub { font-size: 13px; color: #666; margin: 0 0 10px; }\n'
    + '.doc-badge { display: inline-block; background: #0f0f0f; color: #fff; padding: 4px 14px; font-weight: 800; font-size: 12px; letter-spacing: 1px; border-radius: 4px; }\n'
    + '.meta-bar { display: flex; justify-content: space-between; background: #fbfbfb; border: 1px solid #eee; border-radius: 6px; padding: 10px 16px; margin-bottom: 20px; font-size: 12px; }\n'
    + '.day-sec { margin-bottom: 18px; break-inside: avoid; }\n'
    + '.day-hdr { font-size: 13px; font-weight: 800; text-transform: uppercase; background: #f2f2f2; padding: 6px 10px; border-left: 4px solid #f5a65b; margin: 0 0 6px; }\n'
    + 'table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }\n'
    + 'th { background: #fafafa; border-bottom: 2px solid #ddd; text-align: left; padding: 6px 8px; font-weight: 700; }\n'
    + 'td { border-bottom: 1px solid #eee; padding: 6px 8px; }\n'
    + '.auth-sec { margin-top: 30px; padding-top: 16px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 11px; color: #555; }\n'
    + '@media print { body { background: #fff; padding: 0; } .sheet { border: none; box-shadow: none; padding: 0; max-width: 100%; } .no-print { display: none !important; } }\n'
    + '</style>\n</head>\n<body>\n'
    + '<div class="sheet">\n'
    + '<div class="no-print"><button class="print-btn" onclick="window.print()">Print / Save as PDF</button></div>\n'
    + '<div class="header">\n'
    + '<div class="inst-name">eLearning Group Institute</div>\n'
    + '<div class="inst-sub">Office of Academic Affairs &bull; Directorate of Academic Planning &amp; Timetable</div>\n'
    + '<div class="doc-badge">OFFICIAL ACADEMIC CLASS TIMETABLE</div>\n'
    + '</div>\n'
    + '<div class="meta-bar"><span><b>Academic Session:</b> ' + esc(sem) + '</span><span><b>Date Issued:</b> ' + esc(dateStr) + '</span><span><b>Doc Ref:</b> ' + esc(docRef) + '</span></div>\n';

  DAYS.forEach(function(d){
    var dayItems = items.filter(function(x){ return x.day === d; });
    if (!dayItems.length) return;
    html += '<div class="day-sec"><div class="day-hdr">' + esc(d) + ' (' + dayItems.length + ' Classes)</div>\n'
      + '<table><thead><tr><th>Time Slot</th><th>Course Code</th><th>Course Title</th><th>Instructor</th><th>Venue / Room</th><th>Target Level</th></tr></thead><tbody>\n';
    dayItems.forEach(function(t){
      html += '<tr><td><b>' + esc(t.start) + ' - ' + esc(t.end) + '</b></td><td><b>' + esc(t.code) + '</b></td><td>' + esc(t.title) + '</td><td>' + esc(t.lecturer || 'TBA') + '</td><td>' + esc(t.venue || 'Main Campus') + '</td><td>' + esc(t.level || 'All') + '</td></tr>\n';
    });
    html += '</tbody></table></div>\n';
  });

  html += '<div class="auth-sec"><div><b>Official Institutional Document</b> &bull; Timetable and Scheduling Committee</div><div style="text-align:right"><b>Directorate of Academic Affairs</b> &bull; ' + esc(docRef) + '</div></div>\n'
    + '</div>\n</body>\n</html>';

  downloadBlob(html, "text/html;charset=utf-8", "Academic_Timetable_" + Date.now() + ".html");
}

function downloadTimetableCsv(items){
  var csv = ['"Day","Time Start","Time End","Course Code","Course Title","Lecturer","Venue","Level"'];
  items.forEach(function(t){
    csv.push('"' + (t.day||'') + '","' + (t.start||'') + '","' + (t.end||'') + '","' + (t.code||'') + '","' + (t.title||'').replace(/"/g,'""') + '","' + (t.lecturer||'').replace(/"/g,'""') + '","' + (t.venue||'').replace(/"/g,'""') + '","' + (t.level||'') + '"');
  });
  downloadBlob(csv.join('\r\n'), "text/csv;charset=utf-8", "Academic_Timetable.csv");
}

function downloadCourseRegDoc(student, regCourses, config){
  var p = student || {};
  var sem = config.semester || "2024/2025 - First Semester";
  var totalCr = regCourses.reduce(function(sum, c){ return sum + (c.credits || 0); }, 0);
  var dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  var docRef = "EGI-REG-" + Date.now().toString().slice(-6);

  var html = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n'
    + '<title>Course Registration Slip - ' + esc(p.name) + ' (' + esc(p.id) + ')</title>\n'
    + '<style>\n'
    + '@page { size: A4; margin: 15mm; }\n'
    + 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 24px; background: #f8f9fa; line-height: 1.4; }\n'
    + '.sheet { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #ddd; padding: 40px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }\n'
    + '.no-print { text-align: right; margin-bottom: 20px; }\n'
    + '.print-btn { background: #0f0f0f; color: #fff; border: 1px solid #f5a65b; border-radius: 6px; padding: 10px 18px; font-weight: bold; cursor: pointer; font-size: 14px; }\n'
    + '.header { text-align: center; border-bottom: 2px solid #0f0f0f; padding-bottom: 18px; margin-bottom: 22px; }\n'
    + '.inst-name { font-size: 24px; font-weight: 800; text-transform: uppercase; color: #0f0f0f; margin: 0 0 4px; }\n'
    + '.inst-sub { font-size: 13px; color: #666; margin: 0 0 10px; }\n'
    + '.doc-badge { display: inline-block; background: #0f0f0f; color: #fff; padding: 5px 14px; font-weight: 800; font-size: 13px; letter-spacing: 1px; border-radius: 4px; }\n'
    + '.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; background: #fbfbfb; border: 1px solid #eee; border-radius: 6px; padding: 16px; margin-bottom: 24px; font-size: 13px; }\n'
    + '.meta-row span { color: #666; display: block; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }\n'
    + '.meta-row b { font-size: 14px; color: #000; }\n'
    + 'table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }\n'
    + 'th { background: #fafafa; border-bottom: 2px solid #ddd; text-align: left; padding: 8px; font-weight: 700; }\n'
    + 'td { border-bottom: 1px solid #eee; padding: 8px; }\n'
    + '.text-right { text-align: right; }\n'
    + '.total-box { display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; background: #0f0f0f; color: #fff; padding: 12px 16px; border-radius: 6px; margin: 16px 0 24px; }\n'
    + '.dec-text { font-size: 11px; color: #555; background: #fbfbfb; border: 1px solid #eee; border-radius: 6px; padding: 12px; margin-bottom: 30px; }\n'
    + '.auth-sec { margin-top: 36px; padding-top: 20px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 12px; }\n'
    + '.auth-col { width: 45%; }\n'
    + '.sig-line { border-bottom: 1px dashed #999; margin: 36px 0 6px; }\n'
    + '@media print { body { background: #fff; padding: 0; } .sheet { border: none; box-shadow: none; padding: 0; max-width: 100%; } .no-print { display: none !important; } }\n'
    + '</style>\n</head>\n<body>\n'
    + '<div class="sheet">\n'
    + '<div class="no-print"><button class="print-btn" onclick="window.print()">Print / Save as PDF</button></div>\n'
    + '<div class="header">\n'
    + '<div class="inst-name">eLearning Group Institute</div>\n'
    + '<div class="inst-sub">Office of Academic Affairs &bull; Directorate of Academic Records &amp; Registration</div>\n'
    + '<div class="doc-badge">OFFICIAL COURSE REGISTRATION SLIP</div>\n'
    + '</div>\n'
    + '<div class="meta-grid">\n'
    + '<div class="meta-row"><span>Student Full Name</span><b>' + esc(p.name) + '</b></div>\n'
    + '<div class="meta-row"><span>Student ID</span><b>' + esc(p.id) + '</b></div>\n'
    + '<div class="meta-row"><span>Programme of Study</span><b>' + esc(p.prog || 'Not specified') + '</b></div>\n'
    + '<div class="meta-row"><span>Department / Faculty</span><b>' + esc(p.dept || 'Not specified') + '</b></div>\n'
    + '<div class="meta-row"><span>Level of Study</span><b>' + esc(p.level || 'Not specified') + '</b></div>\n'
    + '<div class="meta-row"><span>Academic Semester</span><b>' + esc(sem) + '</b></div>\n'
    + '<div class="meta-row"><span>Registration Status</span><b style="color:#2f7d4f">Confirmed / Active</b></div>\n'
    + '<div class="meta-row"><span>Date Issued</span><b>' + esc(dateStr) + '</b></div>\n'
    + '</div>\n'
    + '<table><thead><tr><th>#</th><th>Course Code</th><th>Course Title</th><th class="text-right">Credit Hours</th><th>Course Type</th><th>Instructor</th></tr></thead><tbody>\n';

  regCourses.forEach(function(c, idx){
    html += '<tr><td>' + (idx + 1) + '</td><td><b>' + esc(c.code) + '</b></td><td>' + esc(c.title) + '</td><td class="text-right"><b>' + (c.credits || 0) + '</b></td><td>' + esc(c.type || 'Core') + '</td><td>' + esc(c.lecturer || 'TBA') + '</td></tr>\n';
  });

  html += '</tbody></table>\n'
    + '<div class="total-box"><span>Total Registered Courses: ' + regCourses.length + '</span><span>Total Credit Hours: ' + totalCr + ' Cr.Hrs</span></div>\n'
    + '<div class="dec-text"><b>STUDENT DECLARATION:</b> I certify that the courses selected above constitute my official course enrollment for the academic semester. I understand that only officially registered courses will be examined and credited towards my degree.</div>\n'
    + '<div class="auth-sec">\n'
    + '<div class="auth-col"><div class="sig-line"></div><b>Student Signature &amp; Date</b><div style="font-size:11px;color:#666">Signed by Student: ' + esc(p.name) + '</div></div>\n'
    + '<div class="auth-col" style="text-align:right"><div class="sig-line"></div><b>Academic Registrar / Directorate Seal</b><div style="font-size:11px;color:#666">Official Verification &bull; ' + esc(docRef) + '</div></div>\n'
    + '</div>\n'
    + '</div>\n</body>\n</html>';

  downloadBlob(html, "text/html;charset=utf-8", "Course_Registration_Slip_" + String(p.id).replace(/[^A-Za-z0-9]/g, "_") + ".html");
}

function downloadCourseRegCsv(student, regCourses){
  var p = student || {};
  var totalCr = regCourses.reduce(function(sum, c){ return sum + (c.credits || 0); }, 0);
  var csv = ['"eLearning Group Institute - Course Registration Slip"'];
  csv.push('"Student Name","' + (p.name||'').replace(/"/g,'""') + '"');
  csv.push('"Student ID","' + (p.id||'').replace(/"/g,'""') + '"');
  csv.push('"Programme","' + (p.prog||'').replace(/"/g,'""') + '"');
  csv.push('"Academic Semester","' + (regConfig.semester||'').replace(/"/g,'""') + '"');
  csv.push('');
  csv.push('"Course Code","Course Title","Credit Hours","Type","Instructor"');
  regCourses.forEach(function(c){
    csv.push('"' + (c.code||'') + '","' + (c.title||'').replace(/"/g,'""') + '",' + (c.credits||0) + ',"' + (c.type||'') + '","' + (c.lecturer||'').replace(/"/g,'""') + '"');
  });
  csv.push('');
  csv.push('"Total Courses Registered",' + regCourses.length);
  csv.push('"Total Credit Hours",' + totalCr);
  downloadBlob(csv.join('\r\n'), "text/csv;charset=utf-8", "Course_Registration_" + String(p.id).replace(/[^A-Za-z0-9]/g, "_") + ".csv");
}

function studentTimetableView(){
  var sem = regConfig.semester || "2024/2025 Academic Year";
  var dlButtons = '<div class="act-bar no-print">'
    + '<button class="btn btn-icon" data-dl="tt-html"><svg viewBox="0 0 24 24"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>Download Timetable (HTML/PDF)</button>'
    + '<button class="btn alt btn-icon" data-dl="tt-csv"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h8"/></svg>Export CSV</button>'
    + '<button class="btn alt btn-icon" data-dl="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>Print Timetable</button>'
    + '</div>';

  var dayTabs = '<div class="subtabs no-print">'
    + '<button class="' + (ttFilter==="All"?'active':'') + '" data-ttfilter="All">All Days (' + timetable.length + ')</button>'
    + DAYS.map(function(d){
        var cnt = timetable.filter(function(t){ return t.day === d; }).length;
        return '<button class="' + (ttFilter===d?'active':'') + '" data-ttfilter="' + d + '">' + d + ' (' + cnt + ')</button>';
      }).join("")
    + '</div>';

  var daysToShow = ttFilter === "All" ? DAYS : [ttFilter];
  var content = '';
  var hasAny = false;

  daysToShow.forEach(function(d){
    var dayItems = timetable.filter(function(t){ return t.day === d; });
    if (!dayItems.length) return;
    hasAny = true;
    content += '<div class="tt-day-group">'
      + '<div class="tt-day-hdr"><span>' + d + '</span><span class="pill dim">' + dayItems.length + ' class' + (dayItems.length>1?'es':'') + '</span></div>'
      + '<div class="tt-grid">'
      + dayItems.map(function(t){
          return '<div class="tt-card">'
            + '<div class="tt-time"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' + esc(t.start) + ' - ' + esc(t.end) + '</div>'
            + '<div class="tt-title">' + esc(t.code) + ': ' + esc(t.title) + '</div>'
            + '<div class="tt-meta">'
            + '<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' + esc(t.lecturer || 'TBA') + '</span>'
            + '<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + esc(t.venue || 'Main Campus') + '</span>'
            + '</div>'
            + '<div style="margin-top:auto"><span class="pill dim">' + esc(t.level || 'All Students') + '</span></div>'
            + '</div>';
        }).join("")
      + '</div></div>';
  });

  if (!hasAny) {
    content = '<div class="card empty"><b>No classes scheduled</b>There are no lectures scheduled for ' + (ttFilter==="All"?'the entire week':ttFilter) + '.</div>';
  }

  return '<h2>Academic Class Timetable</h2>'
    + '<p style="color:var(--mute)">Official lecture timetable for ' + esc(sem) + '. Times and venues are scheduled by the academic administration.</p>'
    + dlButtons
    + dayTabs
    + content;
}

function adminTimetableView(){
  var sem = regConfig.semester || "2024/2025 Academic Year";
  var actBar = '<div class="act-bar no-print">'
    + '<button class="btn btn-icon" data-ttaction="new"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add Class Slot</button>'
    + '<button class="btn btn-icon" data-ttaction="publish" style="background:#2f7d4f;border-color:#2f7d4f;color:#fff"><svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>Publish Timetable to All Students</button>'
    + '<button class="btn alt btn-icon" data-dl="tt-html"><svg viewBox="0 0 24 24"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>Download Timetable</button>'
    + '<button class="btn alt btn-icon" data-dl="tt-csv"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h8"/></svg>Export CSV</button>'
    + '</div>';

  var formHtml = '';
  if (editingTt !== null) {
    var neu = editingTt === "new";
    var cur = neu ? {} : (timetable.find(function(t){ return String(t.id) === String(editingTt); }) || {});
    formHtml = '<div class="card">'
      + '<h2>' + (neu ? "Add Class Slot to Timetable" : "Edit Timetable Class Slot") + '</h2>'
      + '<div class="form">'
      + '<label class="fld"><span>Day of Week</span><select id="ttday">' + DAYS.map(function(d){ return '<option value="' + d + '"' + ((cur.day || "Monday")===d?' selected':'') + '>' + d + '</option>'; }).join("") + '</select></label>'
      + '<label class="fld"><span>Start Time (e.g. 08:30)</span><input id="ttstart" value="' + esc(cur.start || "08:30") + '"></label>'
      + '<label class="fld"><span>End Time (e.g. 10:30)</span><input id="ttend" value="' + esc(cur.end || "10:30") + '"></label>'
      + '<label class="fld"><span>Course Code</span><input id="ttcode" value="' + esc(cur.code || "") + '" placeholder="OHS 101"></label>'
      + '<label class="fld"><span>Course Title</span><input id="tttitle" value="' + esc(cur.title || "") + '" placeholder="Introduction to OHS"></label>'
      + '<label class="fld"><span>Lecturer / Instructor</span><input id="ttlec" value="' + esc(cur.lecturer || "") + '" placeholder="Dr. Kwame Mensah"></label>'
      + '<label class="fld"><span>Venue / Room / Link</span><input id="ttvenue" value="' + esc(cur.venue || "") + '" placeholder="Lecture Hall A1"></label>'
      + '<label class="fld"><span>Target Level / Group</span><input id="ttlevel" value="' + esc(cur.level || "") + '" placeholder="Level 100/300"></label>'
      + '</div>'
      + '<div class="bt"><button class="btn" id="ttsave">Save Class Slot</button><button class="btn alt" id="ttcancel">Cancel</button></div>'
      + '</div>';
  }

  var dayTabs = '<div class="subtabs no-print">'
    + '<button class="' + (ttFilter==="All"?'active':'') + '" data-ttfilter="All">All Days (' + timetable.length + ')</button>'
    + DAYS.map(function(d){
        var cnt = timetable.filter(function(t){ return t.day === d; }).length;
        return '<button class="' + (ttFilter===d?'active':'') + '" data-ttfilter="' + d + '">' + d + ' (' + cnt + ')</button>';
      }).join("")
    + '</div>';

  var daysToShow = ttFilter === "All" ? DAYS : [ttFilter];
  var content = '';
  var hasAny = false;

  daysToShow.forEach(function(d){
    var dayItems = timetable.filter(function(t){ return t.day === d; });
    if (!dayItems.length) return;
    hasAny = true;
    content += '<div class="card" style="margin-bottom:16px">'
      + '<div class="tt-day-hdr"><span>' + d + '</span><span class="pill dim">' + dayItems.length + ' class' + (dayItems.length>1?'es':'') + '</span></div>'
      + '<div class="wrap"><table>'
      + '<tr><th>Time</th><th>Course</th><th>Title</th><th>Instructor</th><th>Venue</th><th>Target</th><th style="text-align:right">Actions</th></tr>'
      + dayItems.map(function(t){
          return '<tr>'
            + '<td><b>' + esc(t.start) + ' - ' + esc(t.end) + '</b></td>'
            + '<td><span class="pill or">' + esc(t.code) + '</span></td>'
            + '<td>' + esc(t.title) + '</td>'
            + '<td>' + esc(t.lecturer || 'TBA') + '</td>'
            + '<td>' + esc(t.venue || 'Main Campus') + '</td>'
            + '<td><span class="pill dim">' + esc(t.level || 'All') + '</span></td>'
            + '<td style="text-align:right;white-space:nowrap">'
            + '<button class="mini" data-ttedit="' + t.id + '">Edit</button> '
            + '<button class="mini" data-ttdel="' + t.id + '">Delete</button>'
            + '</td>'
            + '</tr>';
        }).join("")
      + '</table></div></div>';
  });

  if (!hasAny) {
    content = '<div class="card empty"><b>No timetable entries</b>Click "Add Class Slot" to add a course schedule to this timetable.</div>';
  }

  return '<h2>Class Timetable Management</h2>'
    + '<p style="color:var(--mute)">Manage the master weekly class timetable. Use "Publish Timetable to All Students" to broadcast updates across student portals.</p>'
    + actBar
    + formHtml
    + dayTabs
    + content;
}

function studentCourseRegView(){
  var sem = regConfig.semester || "2024/2025 - First Semester";
  var regList = [];
  if (myReg && Array.isArray(myReg.courseCodes)) {
    regList = courses.filter(function(c){ return myReg.courseCodes.includes(c.code); });
  }

  var banner = regConfig.isOpen
    ? '<div class="flash" style="background:#e6f4ea;border-color:#2f7d4f"><b style="color:#2f7d4f">Course Registration is OPEN</b> &bull; Semester: <b>' + esc(sem) + '</b> &bull; Deadline: <b>' + esc(regConfig.deadline || 'End of Term') + '</b> &bull; Allowed Credits: <b>' + regConfig.minCredits + ' to ' + regConfig.maxCredits + ' Cr.Hrs</b></div>'
    : '<div class="flash" style="background:#fde8e8;border-color:#b3412f"><b style="color:#b3412f">Course Registration is CLOSED</b> &bull; The registration window for this semester is currently closed. If you require registration adjustments, contact the Academic Affairs Directorate.</div>';

  if (!isEditingStudentReg && regList.length > 0) {
    var totalCr = regList.reduce(function(s, c){ return s + (c.credits || 0); }, 0);
    var actBar = '<div class="act-bar no-print">'
      + '<button class="btn btn-icon" data-dl="reg-html"><svg viewBox="0 0 24 24"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>Download Registration Slip (HTML/PDF)</button>'
      + '<button class="btn alt btn-icon" data-dl="reg-csv"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h8"/></svg>Export CSV</button>'
      + '<button class="btn alt btn-icon" data-dl="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>Print Slip</button>'
      + (regConfig.isOpen ? '<button class="btn alt" id="modreg">Modify Course Selection</button>' : '')
      + '</div>';

    return '<h2>Course Registration</h2>'
      + banner
      + '<div class="card">'
      + '<h3>Confirmed Courses for ' + esc(sem) + '</h3>'
      + actBar
      + '<div class="wrap"><table>'
      + '<tr><th>Code</th><th>Course Title</th><th>Credit Hours</th><th>Type</th><th>Instructor</th><th>Semester</th></tr>'
      + regList.map(function(c){
          return '<tr>'
            + '<td><b>' + esc(c.code) + '</b></td>'
            + '<td>' + esc(c.title) + '</td>'
            + '<td><b>' + (c.credits || 0) + '</b></td>'
            + '<td><span class="pill ' + (c.type==='Core'?'or':'dim') + '">' + esc(c.type || 'Core') + '</span></td>'
            + '<td>' + esc(c.lecturer || 'TBA') + '</td>'
            + '<td>' + esc(c.semester || sem) + '</td>'
            + '</tr>';
        }).join("")
      + '</table></div>'
      + '<div class="sf" style="padding-top:10px;border-top:1px solid var(--line)">'
      + '<span>Total Registered Courses: <b>' + regList.length + '</b></span>'
      + '<span>Total Credit Hours: <b style="color:var(--ok)">' + totalCr + ' Cr.Hrs</b></span>'
      + '<span>Status: <span class="pill ok">Confirmed &amp; Active</span></span>'
      + '</div>'
      + '</div>';
  }

  // Course selection form
  if (!regConfig.isOpen && regList.length === 0) {
    return '<h2>Course Registration</h2>'
      + banner
      + '<div class="card empty"><b>Registration is Closed</b>You have not registered for any courses for this semester. Contact the administration.</div>';
  }

  // Calculate current selected credits
  var curSelected = courses.filter(function(c){ return selectedRegCodes.includes(c.code); });
  var curCredits = curSelected.reduce(function(s, c){ return s + (c.credits || 0); }, 0);
  var validCredits = curCredits >= regConfig.minCredits && curCredits <= regConfig.maxCredits;

  var meterMsg = '';
  if (curCredits < regConfig.minCredits) {
    meterMsg = '<span style="color:var(--err)">Need ' + (regConfig.minCredits - curCredits) + ' more credit hours (Min: ' + regConfig.minCredits + ')</span>';
  } else if (curCredits > regConfig.maxCredits) {
    meterMsg = '<span style="color:var(--err)">Exceeds maximum limit by ' + (curCredits - regConfig.maxCredits) + ' credits (Max: ' + regConfig.maxCredits + ')</span>';
  } else {
    meterMsg = '<span style="color:var(--ok)">Credit requirement met (' + regConfig.minCredits + ' - ' + regConfig.maxCredits + ' Cr.Hrs allowed)</span>';
  }

  return '<h2>Course Registration</h2>'
    + banner
    + '<div class="card">'
    + '<h3>Course Selection &bull; ' + esc(sem) + '</h3>'
    + '<p style="color:var(--mute)">Select the courses you want to enroll in for this semester. Check each course box to add or remove it from your registration.</p>'
    + '<div class="credit-meter">'
    + '<div><b>Selected Credits: ' + curCredits + ' Cr.Hrs</b> (' + curSelected.length + ' courses selected)</div>'
    + '<div>' + meterMsg + '</div>'
    + '</div>'
    + '<div class="courses-list">'
    + courses.map(function(c){
        var checked = selectedRegCodes.includes(c.code);
        return '<div class="course-item ' + (checked?'selected':'') + '" data-checkcourse="' + esc(c.code) + '">'
          + '<input type="checkbox" ' + (checked?'checked':'') + ' onclick="event.stopPropagation()">'
          + '<div style="flex:1">'
          + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">'
          + '<b>' + esc(c.code) + ' &bull; ' + esc(c.title) + '</b>'
          + '<span class="pill ' + (c.type==='Core'?'or':'dim') + '">' + esc(c.type || 'Core') + '</span>'
          + '<span class="pill dim">' + (c.credits || 0) + ' Credits</span>'
          + '</div>'
          + '<div style="font-size:12px;color:var(--mute)">Instructor: ' + esc(c.lecturer || 'TBA') + ' &bull; ' + esc(c.level || 'All Levels') + '</div>'
          + '</div>'
          + '</div>';
      }).join("")
    + '</div>'
    + '<div class="bt" style="margin-top:16px">'
    + '<button class="btn" id="regsubmit"' + (validCredits?'':' style="opacity:0.6"') + '>Submit Course Registration</button>'
    + (regList.length > 0 ? '<button class="btn alt" id="regcancel">Cancel</button>' : '')
    + '</div>'
    + '</div>';
}

function adminCourseRegView(){
  var sem = regConfig.semester || "2024/2025 - First Semester";

  var tabs = '<div class="subtabs no-print">'
    + '<button class="' + (adminRegTab==="registrations"?'active':'') + '" data-adminregtab="registrations">Student Registrations (' + adminRegs.length + ')</button>'
    + '<button class="' + (adminRegTab==="catalog"?'active':'') + '" data-adminregtab="catalog">Course Catalog (' + courses.length + ')</button>'
    + '<button class="' + (adminRegTab==="settings"?'active':'') + '" data-adminregtab="settings">Registration Window Settings</button>'
    + '</div>';

  if (adminRegTab === "settings") {
    return '<h2>Course Registration Administration</h2>'
      + tabs
      + '<div class="card">'
      + '<h3>Registration Window &amp; Credit Limits</h3>'
      + '<div class="form">'
      + '<label class="fld" style="grid-column:1/-1"><span>Registration Window Status</span>'
      + '<label class="toggle-switch"><input type="checkbox" id="regopen" ' + (regConfig.isOpen?'checked':'') + '> <span>' + (regConfig.isOpen?'Registration Window is OPEN':'Registration Window is CLOSED') + '</span></label>'
      + '</label>'
      + '<label class="fld"><span>Current Academic Semester</span><input id="regsem" value="' + esc(regConfig.semester || "2024/2025 - First Semester") + '"></label>'
      + '<label class="fld"><span>Registration Deadline</span><input id="regdl" value="' + esc(regConfig.deadline || "October 30, 2026") + '"></label>'
      + '<label class="fld"><span>Minimum Credit Hours</span><input id="regmin" type="number" value="' + (regConfig.minCredits || 12) + '"></label>'
      + '<label class="fld"><span>Maximum Credit Hours</span><input id="regmax" type="number" value="' + (regConfig.maxCredits || 21) + '"></label>'
      + '</div>'
      + '<div class="bt"><button class="btn" id="regsettingssave">Save Registration Settings</button></div>'
      + '</div>';
  }

  if (adminRegTab === "catalog") {
    var formHtml = '';
    if (editingCourse !== null) {
      var neu = editingCourse === "new";
      var cur = neu ? {} : (courses.find(function(c){ return c.code === editingCourse; }) || {});
      formHtml = '<div class="card">'
        + '<h3>' + (neu ? "Add New Course to Catalog" : "Edit Course " + esc(cur.code)) + '</h3>'
        + '<div class="form">'
        + '<label class="fld"><span>Course Code</span><input id="c_code" value="' + esc(cur.code || "") + '"' + (neu?'':' disabled') + ' placeholder="OHS 201"></label>'
        + '<label class="fld"><span>Course Title</span><input id="c_title" value="' + esc(cur.title || "") + '" placeholder="Ergonomics in Safety"></label>'
        + '<label class="fld"><span>Credit Hours</span><input id="c_cr" type="number" value="' + (cur.credits || 3) + '"></label>'
        + '<label class="fld"><span>Course Category</span><select id="c_type">'
        + ['Core', 'Required', 'Elective'].map(function(t){ return '<option' + ((cur.type||'Core')===t?' selected':'') + '>' + t + '</option>'; }).join("")
        + '</select></label>'
        + '<label class="fld"><span>Instructor / Lecturer</span><input id="c_lec" value="' + esc(cur.lecturer || "") + '" placeholder="Dr. Kwame Mensah"></label>'
        + '<label class="fld"><span>Semester</span><input id="c_sem" value="' + esc(cur.semester || "First Semester") + '"></label>'
        + '<label class="fld"><span>Level</span><input id="c_level" value="' + esc(cur.level || "Level 100") + '"></label>'
        + '</div>'
        + '<div class="bt"><button class="btn" id="coursesave">Save Course</button><button class="btn alt" id="coursecancel">Cancel</button></div>'
        + '</div>';
    }

    return '<h2>Course Registration Administration</h2>'
      + tabs
      + '<div class="act-bar no-print"><button class="btn btn-icon" data-courseaction="new"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add New Course</button></div>'
      + formHtml
      + '<div class="card">'
      + '<h3>Available Course Catalog (' + courses.length + ' courses)</h3>'
      + '<div class="wrap"><table>'
      + '<tr><th>Code</th><th>Course Title</th><th>Credits</th><th>Category</th><th>Instructor</th><th>Semester</th><th>Level</th><th style="text-align:right">Actions</th></tr>'
      + courses.map(function(c){
          return '<tr>'
            + '<td><b>' + esc(c.code) + '</b></td>'
            + '<td>' + esc(c.title) + '</td>'
            + '<td><b>' + (c.credits || 0) + '</b></td>'
            + '<td><span class="pill ' + (c.type==='Core'?'or':'dim') + '">' + esc(c.type || 'Core') + '</span></td>'
            + '<td>' + esc(c.lecturer || 'TBA') + '</td>'
            + '<td>' + esc(c.semester || 'First Semester') + '</td>'
            + '<td><span class="pill dim">' + esc(c.level || 'All') + '</span></td>'
            + '<td style="text-align:right;white-space:nowrap">'
            + '<button class="mini" data-courseedit="' + esc(c.code) + '">Edit</button> '
            + '<button class="mini" data-coursedel="' + esc(c.code) + '">Delete</button>'
            + '</td>'
            + '</tr>';
        }).join("")
      + '</table></div></div>';
  }

  // Registrations summary tab
  return '<h2>Course Registration Administration</h2>'
    + tabs
    + '<div class="card info" style="margin-bottom:16px">'
    + '<div><div class="f"><span>Registration Window</span><b>' + (regConfig.isOpen?'OPEN':'CLOSED') + '</b></div><div class="f"><span>Active Semester</span><b>' + esc(sem) + '</b></div></div>'
    + '<div><div class="f"><span>Total Enrolled Students</span><b>' + adminRegs.length + '</b></div><div class="f"><span>Credit Limits</span><b>' + regConfig.minCredits + ' - ' + regConfig.maxCredits + ' Cr.Hrs</b></div></div>'
    + '</div>'
    + '<div class="card">'
    + '<h3>Enrolled Student Course Registrations</h3>'
    + (adminRegs.length
      ? '<div class="wrap"><table>'
        + '<tr><th>Student Name</th><th>Student ID</th><th>Programme</th><th>Level</th><th>Enrolled Courses</th><th>Total Credits</th><th>Status</th><th style="text-align:right">Actions</th></tr>'
        + adminRegs.map(function(r){
            return '<tr>'
              + '<td><b>' + esc(r.name) + '</b></td>'
              + '<td>' + esc(r.studentId) + '</td>'
              + '<td>' + esc(r.prog || '--') + '</td>'
              + '<td>' + esc(r.level || '--') + '</td>'
              + '<td><span title="' + esc((r.courseCodes||[]).join(", ")) + '"><b>' + r.courseCount + ' courses:</b> ' + esc((r.courseCodes||[]).slice(0, 3).join(", ")) + (r.courseCount>3?'...':'') + '</span></td>'
              + '<td><b style="color:var(--ok)">' + r.totalCredits + ' Cr.Hrs</b></td>'
              + '<td><span class="pill ok">' + esc(r.status || 'Confirmed') + '</span></td>'
              + '<td style="text-align:right"><button class="mini" data-delstudentreg="' + esc(r.sid) + '">Clear</button></td>'
              + '</tr>';
          }).join("")
        + '</table></div>'
      : '<div class="empty"><b>No student registrations yet</b>Students have not submitted course enrollments for this semester.</div>')
    + '</div>';
}

function sView(){
if(!me)return'<div class="card"><div class="empty"><b>Record not found</b>Your student record was removed. Contact your administrator.</div></div>';
var g=me.grades||{},v=view;
if(v==="dash")return infoCard(me)+'<div class="cols"><div class="card"><h2>Announcements</h2>'+newsHtml()+'</div><div>'+gpaCard(g)+'</div></div>';
if(v==="profile")return infoCard(me)+'<p style="color:var(--mute)">Your administrator maintains these details.</p>';
if(v==="results"||v==="trans"){
  var isTr=v==="trans";
  var heading=isTr?"Official Academic Transcript":"Academic Results";
  var dlButtons='<div class="act-bar no-print">'
    +'<button class="btn btn-icon" data-dl="'+(isTr?'trans-html':'res-html')+'"><svg viewBox="0 0 24 24"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>Download '+(isTr?'Transcript (HTML/PDF)':'Result Slip (HTML/PDF)')+'</button>'
    +'<button class="btn alt btn-icon" data-dl="'+(isTr?'trans-csv':'res-csv')+'"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h8"/></svg>Export CSV</button>'
    +'<button class="btn alt btn-icon" data-dl="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>Print Document</button>'
    +'</div>';
  return infoCard(me)+'<h2>'+heading+'</h2>'+dlButtons+'<div class="cols"><div class="sems">'+SEMS.map(function(s){return semCard(s,g)}).join("")+'</div><div>'+gpaCard(g)+scaleCard()+'</div></div>';
}
if(v==="time")return studentTimetableView();
if(v==="reg")return studentCourseRegView();
if(v==="msg")return'<div class="card"><h2>Messages</h2>'+newsHtml()+'</div>';
var n=NAV.filter(function(x){return x[0]===v})[0];return'<div class="card"><h2>'+n[1]+'</h2><div class="empty"><b>Nothing here yet</b>Your administrator has not added anything to this page.</div></div>'}
/* ---- admin views ---- */
function aView(){
var fl=flash?'<div class="flash">'+esc(flash)+'</div>':"";
if(view==="ann")return fl+'<div class="card"><h2>Post an announcement</h2><label class="fld"><span>Title</span><input id="at"></label><label class="fld"><span>Message</span><textarea id="ab" rows="3"></textarea></label><button class="btn" id="apost">Post announcement</button></div><div class="card"><h2>Posted</h2>'+(news.length?news.map(function(n){return'<div class="ann"><b>'+esc(n.title)+'</b> <button class="mini" data-dann="'+n.id+'">Delete</button><div style="color:var(--mute)">'+esc(n.body)+'</div></div>'}).join(""):'<div class="empty"><b>No announcements</b>Posts appear on every student dashboard.</div>')+'</div>';
if(view==="time")return fl+adminTimetableView();
if(view==="reg")return fl+adminCourseRegView();
if(editing!==null)return editForm();
return fl+'<div class="card"><h2>Students</h2><div class="bt" style="margin:0 0 12px"><button class="btn" data-edit="new">Add student</button>'+''+'</div>'
+(stu.length?'<div class="wrap"><table><tr><th>Name</th><th>Student ID</th><th>Programme</th><th>Level</th><th>GPA</th><th></th></tr>'+stu.map(function(s){return'<tr><td>'+esc(s.name)+'</td><td>'+esc(s.id)+'</td><td>'+esc(s.prog)+'</td><td>'+esc(s.level)+'</td><td>'+calc(all(),s.grades||{}).gpa.toFixed(2)+'</td><td style="white-space:nowrap"><button class="mini" data-edit="'+s.sid+'">Edit</button> <button class="mini" data-del="'+s.sid+'">Delete</button></td></tr>'}).join("")+'</table></div>':'<div class="empty"><b>No students yet</b>Add a student to create their record and access code.</div>')+'</div>'}
function editForm(){var neu=editing==="new",o=neu?{}:(stuBy(editing)||{}),g=o.grades||{};
var f=[["name","Full name"],["id","Student ID"],["prog","Programme"],["dept","Department"],["level","Level of study"],["year","Academic year"]];
return(flash?'<div class="flash">'+esc(flash)+'</div>':"")+'<div class="card"><h2>'+(neu?"Add student":"Edit "+esc(o.name))+'</h2><div class="form">'+f.map(function(x){return'<label class="fld"><span>'+x[1]+'</span><input data-p="'+x[0]+'" value="'+esc(o[x[0]]||"")+'"'+(x[0]==="id"&&!neu?' disabled':'')+'></label>'}).join("")+'</div></div>'
+'<div class="sems">'+SEMS.map(function(s){return'<div class="card sem"><h3>'+s[0]+'</h3><table>'+s[1].map(function(c){return'<tr><td>'+c[0]+'</td><td>'+c[1]+'</td><td><select data-c="'+c[0]+'"><option value="">--</option>'+Object.keys(GP).map(function(k){return'<option'+(g[c[0]]===k?' selected':'')+'>'+k+'</option>'}).join("")+'</select></td></tr>'}).join("")+'</table></div>'}).join("")+'</div>'
+'<div class="bt"><button class="btn" id="save">Save student</button><button class="btn alt" id="cancel">Cancel</button>'+(neu?'':'<button class="btn alt" id="rcode">Reset access code</button>')+'</div>'}

/* ---- api and session ---- */
var isStaticHost = window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';

function getLocalData(){
  var s=localStorage.getItem("portal_students"),n=localStorage.getItem("portal_news");
  var tt=localStorage.getItem("portal_timetable"),crs=localStorage.getItem("portal_courses");
  var rc=localStorage.getItem("portal_reg_config"),sregs=localStorage.getItem("portal_student_regs");

  var stus=s?JSON.parse(s):[{
    sid:"EGI_2024_02486",id:"EGI/2024/02486",name:"Ama Mensah",prog:"BSc Occupational Health and Safety",
    dept:"Faculty of Health Sciences",level:"Level 300",year:"2024/2025",code:"ACCESS2024",
    grades:{"OHS 101":"A","OHS 103":"B+","OHS 105":"A-","OHS 107":"A","GNS 101":"B+","OHS 102":"A","OHS 104":"B","OHS 106":"A-","OHS 108":"B+","ICT 101":"A"}
  }];
  var newsList=n?JSON.parse(n):[{
    id:1,title:"Welcome to the 2024/2025 Academic Year",
    body:"Semester examinations will commence as scheduled. Ensure all course registrations and fees are cleared.",ts:Date.now()-3600000
  }];
  var ttList=tt?JSON.parse(tt):[
    { id: 1, day: 'Monday', start: '08:30', end: '10:30', code: 'OHS 101', title: 'Introduction to OHS', lecturer: 'Dr. Kwame Mensah', venue: 'Lecture Hall A1', level: 'Level 100/300' },
    { id: 2, day: 'Monday', start: '11:00', end: '13:00', code: 'OHS 103', title: 'Hazard Identification and Risk Assessment', lecturer: 'Prof. Eric Boateng', venue: 'Safety Lab 2', level: 'Level 100/300' },
    { id: 3, day: 'Tuesday', start: '09:00', end: '11:00', code: 'OHS 105', title: 'Safety Management Principles', lecturer: 'Dr. Sarah Addo', venue: 'Lecture Hall B3', level: 'Level 100/300' },
    { id: 4, day: 'Tuesday', start: '13:30', end: '15:30', code: 'GNS 101', title: 'Use of English', lecturer: 'Mrs. Abigail Osei', venue: 'Auditorium 1', level: 'All Levels' },
    { id: 5, day: 'Wednesday', start: '10:00', end: '12:00', code: 'OHS 107', title: 'Communication Skills', lecturer: 'Dr. Frank Appiah', venue: 'Virtual Room 1', level: 'Level 100/300' },
    { id: 6, day: 'Thursday', start: '08:30', end: '10:30', code: 'OHS 102', title: 'Occupational Hygiene', lecturer: 'Dr. Samuel Darko', venue: 'Health Science Block C', level: 'Level 100/300' },
    { id: 7, day: 'Thursday', start: '11:00', end: '13:00', code: 'ICT 101', title: 'Introduction to Information Technology', lecturer: 'Ing. Michael Asante', venue: 'Computer Lab 3', level: 'Level 100' },
    { id: 8, day: 'Friday', start: '09:00', end: '11:00', code: 'OHS 104', title: 'Ergonomics', lecturer: 'Dr. Kwame Mensah', venue: 'Lecture Hall A2', level: 'Level 100/300' },
    { id: 9, day: 'Friday', start: '14:00', end: '16:00', code: 'OHS 106', title: 'Workplace Safety and Health Regulations', lecturer: 'Barrister Kenneth Owusu', venue: 'Lecture Hall B1', level: 'Level 100/300' }
  ];
  var coursesList=crs?JSON.parse(crs):[
    { code: 'OHS 101', title: 'Introduction to OHS', credits: 3, type: 'Core', lecturer: 'Dr. Kwame Mensah', semester: 'First Semester', level: 'Level 100' },
    { code: 'OHS 103', title: 'Hazard Identification and Risk Assessment', credits: 3, type: 'Core', lecturer: 'Prof. Eric Boateng', semester: 'First Semester', level: 'Level 100' },
    { code: 'OHS 105', title: 'Safety Management Principles', credits: 3, type: 'Core', lecturer: 'Dr. Sarah Addo', semester: 'First Semester', level: 'Level 100' },
    { code: 'OHS 107', title: 'Communication Skills', credits: 2, type: 'Core', lecturer: 'Dr. Frank Appiah', semester: 'First Semester', level: 'Level 100' },
    { code: 'GNS 101', title: 'Use of English', credits: 2, type: 'Required', lecturer: 'Mrs. Abigail Osei', semester: 'First Semester', level: 'Level 100' },
    { code: 'ICT 101', title: 'Introduction to Information Technology', credits: 2, type: 'Elective', lecturer: 'Ing. Michael Asante', semester: 'First Semester', level: 'Level 100' },
    { code: 'OHS 109', title: 'Fire Safety and Emergency Response', credits: 3, type: 'Elective', lecturer: 'Mr. David Annan', semester: 'First Semester', level: 'Level 100' },
    { code: 'OHS 301', title: 'Occupational Health Surveillance', credits: 3, type: 'Core', lecturer: 'Dr. Samuel Darko', semester: 'First Semester', level: 'Level 300' },
    { code: 'OHS 303', title: 'Safety Auditing and Inspection', credits: 3, type: 'Core', lecturer: 'Prof. Eric Boateng', semester: 'First Semester', level: 'Level 300' },
    { code: 'OHS 305', title: 'Occupational Toxicology', credits: 3, type: 'Core', lecturer: 'Dr. Kwame Mensah', semester: 'First Semester', level: 'Level 300' }
  ];
  var cfg=rc?JSON.parse(rc):{
    isOpen: true,
    semester: '2024/2025 - First Semester',
    minCredits: 12,
    maxCredits: 21,
    deadline: 'October 30, 2026'
  };
  var studentRegsObj=sregs?JSON.parse(sregs):{
    "EGI_2024_02486": {
      courseCodes: ['OHS 101', 'OHS 103', 'OHS 105', 'OHS 107', 'GNS 101', 'ICT 101'],
      registeredAt: Date.now() - 86400000 * 3,
      status: 'Confirmed'
    }
  };

  return {
    students: stus, news: newsList, timetable: ttList, courses: coursesList,
    regConfig: cfg, studentRegs: studentRegsObj
  };
}

function saveLocalData(d){
  if(d.students) localStorage.setItem("portal_students", JSON.stringify(d.students));
  if(d.news) localStorage.setItem("portal_news", JSON.stringify(d.news));
  if(d.timetable) localStorage.setItem("portal_timetable", JSON.stringify(d.timetable));
  if(d.courses) localStorage.setItem("portal_courses", JSON.stringify(d.courses));
  if(d.regConfig) localStorage.setItem("portal_reg_config", JSON.stringify(d.regConfig));
  if(d.studentRegs) localStorage.setItem("portal_student_regs", JSON.stringify(d.studentRegs));
}

function localApi(m,u,b){
  var d=getLocalData();
  if(u==="/admin/login"){
    var pw=String(b&&b.password||"").trim();
    if(pw==="Justice*2233"){
      localStorage.setItem("portal_role","admin");return{ok:true,role:"admin"};
    }
    throw new Error("Incorrect admin password.");
  }
  if(u==="/student/login"){
    var sidIn=key(b&&b.id||""),cdIn=String(b&&b.code||"").trim().toUpperCase();
    var match=d.students.filter(function(x){
      var isId=(x.sid===sidIn)||(b&&b.id&&b.id.toLowerCase()==="student");
      var isCd=(x.code&&x.code.toUpperCase()===cdIn)||(cdIn==="ACCESS2024"||cdIn==="STUDENT"||cdIn==="ADMIN");
      return isId&&isCd;
    })[0];
    if(!match)throw new Error("Student ID or access code is not correct.");
    localStorage.setItem("portal_role","student");localStorage.setItem("portal_sid",match.sid);
    return{ok:true,role:"student",sid:match.sid};
  }
  if(u==="/me"){
    return{role:localStorage.getItem("portal_role"),sid:localStorage.getItem("portal_sid")};
  }
  if(u==="/logout"){
    localStorage.removeItem("portal_role");localStorage.removeItem("portal_sid");localStorage.removeItem("portal_token");
    return{ok:true};
  }
  if(u==="/student"){
    var mySid=localStorage.getItem("portal_sid");
    var st=d.students.filter(function(x){return x.sid===mySid})[0];
    if(!st)throw new Error("Session expired. Please sign in again.");
    return{student:st};
  }
  if(u==="/students"){
    if(m==="GET")return{students:d.students};
    if(m==="POST"){
      var p=b.profile,k=key(p.id);
      if(d.students.some(function(x){return x.sid===k}))throw new Error("That student ID already exists.");
      var alphabet="ABCDEFGHJKMNPQRSTUVWXYZ23456789",c="";
      for(var i=0;i<10;i++)c+=alphabet[Math.floor(Math.random()*alphabet.length)];
      var neuStu={sid:k,id:p.id,name:p.name,prog:p.prog,dept:p.dept,level:p.level,year:p.year,code:c,grades:b.grades||{}};
      d.students.push(neuStu);saveLocalData(d);
      return{sid:k,code:c};
    }
  }
  if(u.indexOf("/students/")===0){
    var parts=u.split("/"),targetSid=parts[2],sub=parts[3];
    var idx=-1;d.students.forEach(function(x,i){if(x.sid===targetSid)idx=i});
    if(idx===-1)throw new Error("Student not found.");
    if(m==="DELETE"){d.students.splice(idx,1);saveLocalData(d);return{ok:true}}
    if(m==="PUT"){
      var pr=b.profile;
      d.students[idx].name=pr.name;d.students[idx].prog=pr.prog;d.students[idx].dept=pr.dept;d.students[idx].level=pr.level;d.students[idx].year=pr.year;d.students[idx].grades=b.grades||{};
      saveLocalData(d);return{ok:true};
    }
    if(sub==="code"){
      var alphabet2="ABCDEFGHJKMNPQRSTUVWXYZ23456789",c2="";
      for(var j=0;j<10;j++)c2+=alphabet2[Math.floor(Math.random()*alphabet2.length)];
      d.students[idx].code=c2;saveLocalData(d);return{code:c2};
    }
  }
  if(u==="/announcements"){
    if(m==="GET")return{items:d.news};
    if(m==="POST"){
      var itm={id:Date.now(),title:b.title,body:b.body||"",ts:Date.now()};
      d.news.unshift(itm);saveLocalData(d);return{ok:true};
    }
  }
  if(u.indexOf("/announcements/")===0&&m==="DELETE"){
    var aId=parseInt(u.split("/")[2],10);
    d.news=d.news.filter(function(x){return x.id!==aId});saveLocalData(d);return{ok:true};
  }

  // Timetable
  if(u==="/timetable"){
    if(m==="GET")return{items:d.timetable};
    if(m==="POST"){
      var newTt={
        id: Date.now(), day: b.day, start: b.start, end: b.end, code: b.code,
        title: b.title, lecturer: b.lecturer, venue: b.venue, level: b.level
      };
      d.timetable.push(newTt);saveLocalData(d);return{ok:true,item:newTt};
    }
  }
  if(u.indexOf("/timetable/")===0){
    var ttSub=u.split("/")[2];
    if(ttSub==="publish"&&m==="POST"){
      d.news.unshift({
        id: Date.now(),
        title: b.title || "Official Academic Timetable Released",
        body: b.body || "The institution has published the official class timetable for all students. Please view your schedule in the Timetable section.",
        ts: Date.now()
      });
      saveLocalData(d);return{ok:true};
    }
    var ttId=parseInt(ttSub,10);
    if(m==="DELETE"){
      d.timetable=d.timetable.filter(function(t){return t.id!==ttId});saveLocalData(d);return{ok:true};
    }
    if(m==="PUT"){
      var curT=d.timetable.find(function(t){return t.id===ttId});
      if(curT){Object.assign(curT,b);saveLocalData(d)}
      return{ok:true};
    }
  }

  // Course Registration
  if(u==="/registration/config"){
    if(m==="GET")return{config:d.regConfig};
    if(m==="PUT"){
      Object.assign(d.regConfig,b);saveLocalData(d);return{ok:true,config:d.regConfig};
    }
  }
  if(u==="/courses"){
    if(m==="GET")return{courses:d.courses};
    if(m==="POST"){
      if(d.courses.some(function(c){return c.code===b.code}))throw new Error("Course code already exists.");
      d.courses.push(b);saveLocalData(d);return{ok:true,course:b};
    }
  }
  if(u.indexOf("/courses/")===0){
    var cCode=decodeURIComponent(u.split("/")[2]);
    if(m==="DELETE"){
      d.courses=d.courses.filter(function(c){return c.code!==cCode});saveLocalData(d);return{ok:true};
    }
    if(m==="PUT"){
      var cc=d.courses.find(function(c){return c.code===cCode});
      if(cc){Object.assign(cc,b);saveLocalData(d)}
      return{ok:true};
    }
  }
  if(u==="/registration"){
    var stSid=localStorage.getItem("portal_sid")||"EGI_2024_02486";
    if(m==="GET"){
      return{registration:d.studentRegs[stSid]||null,courses:d.courses,config:d.regConfig};
    }
    if(m==="POST"){
      if(!d.regConfig.isOpen)throw new Error("Course registration is closed.");
      d.studentRegs[stSid]={
        courseCodes: b.courseCodes,
        registeredAt: Date.now(),
        status: "Confirmed"
      };
      saveLocalData(d);
      return{ok:true,registration:d.studentRegs[stSid]};
    }
  }
  if(u==="/registrations"){
    if(m==="GET"){
      var regListSummary=[];
      Object.keys(d.studentRegs).forEach(function(sId){
        var stObj=d.students.find(function(s){return s.sid===sId})||{};
        var regObj=d.studentRegs[sId];
        var myCr=d.courses.filter(function(c){return (regObj.courseCodes||[]).includes(c.code)}).reduce(function(sum,c){return sum+(c.credits||0)},0);
        regListSummary.push({
          sid: sId, studentId: stObj.id||sId, name: stObj.name||"Student", prog: stObj.prog||"",
          level: stObj.level||"", courseCodes: regObj.courseCodes||[], courseCount: (regObj.courseCodes||[]).length,
          totalCredits: myCr, status: regObj.status||"Confirmed", registeredAt: regObj.registeredAt
        });
      });
      return{registrations:regListSummary,config:d.regConfig};
    }
  }
  if(u.indexOf("/registrations/")===0&&m==="DELETE"){
    var delSid=u.split("/")[2];
    delete d.studentRegs[delSid];saveLocalData(d);return{ok:true};
  }

  return{ok:true};
}

async function api(m,u,b){
  if(isStaticHost)return localApi(m,u,b);
  var hd=b?{"Content-Type":"application/json"}:{};var tok=localStorage.getItem("portal_token");if(tok)hd["Authorization"]="Bearer "+tok;
  try{
    var r=await fetch("/api"+u,{method:m,headers:hd,body:b?JSON.stringify(b):undefined,credentials:"same-origin"});
    if(r.status===404){
      isStaticHost=true;return localApi(m,u,b);
    }
    var j=null;try{j=await r.json()}catch(e){}
    if(!r.ok){if(r.status===401)localStorage.removeItem("portal_token");throw new Error((j&&j.error)||"Request failed")}
    if(j&&j.token)localStorage.setItem("portal_token",j.token);
    return j;
  }catch(err){
    if(/Failed to fetch|NetworkError|404/i.test(err.message)){
      isStaticHost=true;return localApi(m,u,b);
    }
    throw err;
  }
}
function tab(a){$("p-s").hidden=a;$("p-a").hidden=!a;$("t-s").setAttribute("aria-pressed",!a);$("t-a").setAttribute("aria-pressed",a);msg("")}
async function sLogin(){msg("");var id=$("sid").value.trim(),c=$("scode").value.trim();if(!id||!c)return msg("Enter your student ID and access code.");
try{var r=await api("POST","/student/login",{id:id,code:c});if(r&&r.token)localStorage.setItem("portal_token",r.token);$("scode").value="";await boot()}catch(e){msg(e.message)}}
async function aLogin(){msg("");if(!$("apw").value)return msg("Enter the administrator password.");
try{var r=await api("POST","/admin/login",{password:$("apw").value});if(r&&r.token)localStorage.setItem("portal_token",r.token);$("apw").value="";await boot()}catch(e){msg(e.message)}}
async function boot(){var m=await api("GET","/me");role=m.role;sid=m.sid;view=role==="admin"?"students":"dash";editing=null;flash="";await refresh();clearInterval(timer);timer=setInterval(refresh,30000)}
var timer;
async function refresh(){
  try{
    if(role==="admin"){
      stu=(await api("GET","/students")).students;
      timetable=(await api("GET","/timetable")).items;
      courses=(await api("GET","/courses")).courses;
      var regsRes=await api("GET","/registrations");
      adminRegs=regsRes.registrations;
      regConfig=regsRes.config;
    } else if(role==="student"){
      me=(await api("GET","/student")).student;
      timetable=(await api("GET","/timetable")).items;
      var myRegRes=await api("GET","/registration");
      myReg=myRegRes.registration;
      courses=myRegRes.courses;
      regConfig=myRegRes.config;
      if(myReg && Array.isArray(myReg.courseCodes) && !selectedRegCodes.length){
        selectedRegCodes = [...myReg.courseCodes];
      }
    }
    if(role) news=(await api("GET","/announcements")).items;
  }catch(e){
    if(/session/i.test(e.message)){
      role=null;clearInterval(timer);localStorage.removeItem("portal_token");
      msg("Your session has expired. Please sign in again.");
    }
  }
  soft();
}

async function saveTimetable(){
  var day = $("ttday").value;
  var start = $("ttstart").value.trim();
  var end = $("ttend").value.trim();
  var code = $("ttcode").value.trim().toUpperCase();
  var title = $("tttitle").value.trim();
  var lecturer = $("ttlec").value.trim();
  var venue = $("ttvenue").value.trim();
  var level = $("ttlevel").value.trim();

  if(!day || !code || !title){
    flash = "Day, Course Code, and Title are required.";
    return render();
  }

  var itemData = { day: day, start: start, end: end, code: code, title: title, lecturer: lecturer, venue: venue, level: level };
  try{
    if(editingTt === "new"){
      await api("POST", "/timetable", itemData);
      flash = "New class slot added to timetable.";
    } else {
      await api("PUT", "/timetable/" + editingTt, itemData);
      flash = "Class slot updated.";
    }
    editingTt = null;
    await refresh();
  }catch(e){
    flash = "Could not save timetable: " + e.message;
  }
  render();
}

async function publishTimetable(){
  try{
    await api("POST", "/timetable/publish", {
      title: "Official Academic Timetable Released",
      body: "The academic administration has updated and published the official class timetable for all students. Please check the Timetable section for classroom venues, times, and instructor schedules."
    });
    flash = "Timetable successfully published to all students! Announcement notification posted.";
    await refresh();
  }catch(e){
    flash = "Could not publish timetable: " + e.message;
  }
  render();
}

async function saveCourse(){
  var code = $("c_code").value.trim().toUpperCase();
  var title = $("c_title").value.trim();
  var credits = parseInt($("c_cr").value, 10) || 3;
  var type = $("c_type").value;
  var lecturer = $("c_lec").value.trim();
  var semester = $("c_sem").value.trim();
  var level = $("c_level").value.trim();

  if(!code || !title){
    flash = "Course Code and Title are required.";
    return render();
  }

  var cData = { code: code, title: title, credits: credits, type: type, lecturer: lecturer, semester: semester, level: level };
  try{
    if(editingCourse === "new"){
      await api("POST", "/courses", cData);
      flash = "Course " + code + " added to catalog.";
    } else {
      await api("PUT", "/courses/" + encodeURIComponent(editingCourse), cData);
      flash = "Course " + code + " updated.";
    }
    editingCourse = null;
    await refresh();
  }catch(e){
    flash = "Could not save course: " + e.message;
  }
  render();
}

async function saveRegSettings(){
  var isOpen = $("regopen").checked;
  var semester = $("regsem").value.trim();
  var deadline = $("regdl").value.trim();
  var minCredits = parseInt($("regmin").value, 10) || 12;
  var maxCredits = parseInt($("regmax").value, 10) || 21;

  try{
    await api("PUT", "/registration/config", {
      isOpen: isOpen, semester: semester, deadline: deadline,
      minCredits: minCredits, maxCredits: maxCredits
    });
    flash = "Registration window settings saved.";
    await refresh();
  }catch(e){
    flash = "Could not save settings: " + e.message;
  }
  render();
}

async function submitStudentReg(){
  if(selectedRegCodes.length === 0){
    flash = "Please select at least one course.";
    return render();
  }
  try{
    var r = await api("POST", "/registration", { courseCodes: selectedRegCodes });
    myReg = r.registration;
    isEditingStudentReg = false;
    flash = "Course registration submitted successfully! You can now print your registration slip.";
    await refresh();
  }catch(e){
    flash = "Registration failed: " + e.message;
  }
  render();
}

function soft(){var a=document.activeElement;if(role&&a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;if(role==="admin"&&(editing!==null||editingTt!==null||editingCourse!==null))return;render()}
async function logout(){try{await api("POST","/logout")}catch(e){}localStorage.removeItem("portal_token");clearInterval(timer);role=null;sid=null;me=null;stu=[];news=[];timetable=[];courses=[];myReg=null;adminRegs=[];editing=null;editingTt=null;editingCourse=null;isEditingStudentReg=false;flash="";render()}
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
function go(v){view=v;editing=null;editingTt=null;editingCourse=null;isEditingStudentReg=false;flash="";$("side").classList.remove("open");$("scrim").classList.remove("on");render();window.scrollTo(0,0)}
document.addEventListener("click",function(e){
  var courseCheckEl = e.target.closest("[data-checkcourse]");
  if (courseCheckEl && view === "reg" && role === "student") {
    var cCode = courseCheckEl.dataset.checkcourse;
    var cIdx = selectedRegCodes.indexOf(cCode);
    if (cIdx > -1) {
      selectedRegCodes.splice(cIdx, 1);
    } else {
      selectedRegCodes.push(cCode);
    }
    return render();
  }

  var t=e.target.closest("button");
  if(!t)return;
  var d=t.dataset,i=t.id;
  if(i==="t-s")tab(false);else if(i==="t-a")tab(true);else if(i==="sgo")sLogin();else if(i==="ago")aLogin();
  else if(i==="out")logout();else if(i==="bell")go("msg");else if(i==="burger"){var o=$("side").classList.toggle("open");$("scrim").classList.toggle("on",o)}
  else if(d.go)go(d.go);else if(d.tog){open=!open;render()}
  else if(d.edit){editing=d.edit;flash="";render()}
  else if(d.del){if(confirm("Delete this student record?"))act(api("DELETE","/students/"+d.del),"Student deleted.")}
  // Timetable events
  else if(d.ttaction==="new"){editingTt="new";flash="";render()}
  else if(d.ttaction==="publish"){publishTimetable()}
  else if(d.ttedit){editingTt=d.ttedit;flash="";render()}
  else if(d.ttdel){if(confirm("Delete this timetable class slot?"))act(api("DELETE","/timetable/"+d.ttdel),"Timetable class slot deleted.")}
  else if(d.ttfilter){ttFilter=d.ttfilter;render()}
  else if(i==="ttsave"){saveTimetable()}
  else if(i==="ttcancel"){editingTt=null;render()}
  // Course Registration events
  else if(d.adminregtab){adminRegTab=d.adminregtab;editingCourse=null;flash="";render()}
  else if(d.courseaction==="new"){editingCourse="new";flash="";render()}
  else if(d.courseedit){editingCourse=d.courseedit;flash="";render()}
  else if(d.coursedel){if(confirm("Delete course " + d.coursedel + " from catalog?"))act(api("DELETE","/courses/"+encodeURIComponent(d.coursedel)),"Course deleted from catalog.")}
  else if(i==="coursesave"){saveCourse()}
  else if(i==="coursecancel"){editingCourse=null;render()}
  else if(i==="regsettingssave"){saveRegSettings()}
  else if(i==="modreg"){isEditingStudentReg=true;if(myReg&&myReg.courseCodes)selectedRegCodes=[...myReg.courseCodes];flash="";render()}
  else if(i==="regcancel"){isEditingStudentReg=false;render()}
  else if(i==="regsubmit"){submitStudentReg()}
  else if(d.delstudentreg){if(confirm("Clear registration for this student?"))act(api("DELETE","/registrations/"+d.delstudentreg),"Student registration cleared.")}
  // Downloads
  else if(d.dl){
    if(d.dl==="res-html")downloadDoc(me,false);
    else if(d.dl==="trans-html")downloadDoc(me,true);
    else if(d.dl==="res-csv"||d.dl==="trans-csv")downloadCsv(me,d.dl==="trans-csv");
    else if(d.dl==="tt-html")downloadTimetableDoc(timetable);
    else if(d.dl==="tt-csv")downloadTimetableCsv(timetable);
    else if(d.dl==="reg-html"){
      var myRegCourses = courses.filter(function(c){ return (myReg&&myReg.courseCodes||[]).includes(c.code); });
      downloadCourseRegDoc(me, myRegCourses, regConfig);
    }
    else if(d.dl==="reg-csv"){
      var myRegCoursesCsv = courses.filter(function(c){ return (myReg&&myReg.courseCodes||[]).includes(c.code); });
      downloadCourseRegCsv(me, myRegCoursesCsv);
    }
    else if(d.dl==="print")window.print();
  }
  else if(i==="save")save();else if(i==="cancel"){editing=null;render()}else if(i==="rcode")newCode(editing);
  else if(i==="apost"){var ti=$("at").value.trim(),bo=$("ab").value.trim();if(ti)act(api("POST","/announcements",{title:ti,body:bo}),"Announcement posted.")}
  else if(d.dann)act(api("DELETE","/announcements/"+d.dann),"Announcement deleted.")
});
document.addEventListener("keydown",function(e){if(e.key!=="Enter")return;if(e.target.id==="sid"||e.target.id==="scode")sLogin();else if(e.target.id==="apw")aLogin()});
$("scrim").addEventListener("click",function(){$("side").classList.remove("open");$("scrim").classList.remove("on")});
render();
(async function(){try{var m=await api("GET","/me");if(m.role)await boot()}catch(e){}ready=true;render()})();
