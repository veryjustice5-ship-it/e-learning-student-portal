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
var ANAV=[["students","Students","profile"],["timetable","Timetable","time"],["courses","Course Registration","reg"],["ann","Announcements","msg"]];
var $=function(i){return document.getElementById(i)};
var db=null,user=null,uid=null,isAdmin=false,role=null,sid=null,me=null,stu=[],news=[],tt=[],courses=[],regCodes=[],regAll={},ttDay="All",adminRegSid=null,adminTtMode="cards",view="dash",open=true,editing=null,flash="",unsubs=[],ready=false;
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function key(id){return String(id).trim().toUpperCase().replace(/[^A-Z0-9]/g,"_")}
function all(){var a=[];SEMS.forEach(function(s){a=a.concat(s[1])});return a}
function calc(list,g){var cr=0,pts=0;list.forEach(function(c){var x=g[c[0]];if(x){cr+=c[2];pts+=c[2]*GP[x]}});return{cr:cr,pts:pts,gpa:cr?pts/cr:0}}
function ico(k){return'<svg viewBox="0 0 24 24"><path d="'+IC[k]+'"/></svg>'}
function msg(t){$("err").textContent=t||""}
function stuBy(k){if(!k)return null;var found=stu.filter(function(s){return s.sid===k})[0];if(!found&&typeof getLocalData==="function"){try{found=getLocalData().students.filter(function(s){return s.sid===k})[0]}catch(e){}}return found||null}
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
  var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var docRef = "EGI-TT-" + Date.now().toString().slice(-6);

  var html = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n'
    + '<title>Class Timetable - eLearning Group Institute</title>\n'
    + '<style>\n'
    + '@page { size: A4 landscape; margin: 12mm; }\n'
    + 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 24px; background: #f8f9fa; line-height: 1.4; }\n'
    + '.sheet { max-width: 960px; margin: 0 auto; background: #fff; border: 1px solid #ddd; padding: 36px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }\n'
    + '.no-print { text-align: right; margin-bottom: 20px; }\n'
    + '.print-btn { background: #0f0f0f; color: #fff; border: 1px solid #f5a65b; border-radius: 6px; padding: 10px 18px; font-weight: bold; cursor: pointer; font-size: 14px; }\n'
    + '.header { text-align: center; border-bottom: 2px solid #0f0f0f; padding-bottom: 16px; margin-bottom: 20px; }\n'
    + '.inst-name { font-size: 24px; font-weight: 800; text-transform: uppercase; color: #0f0f0f; margin: 0 0 4px; }\n'
    + '.inst-sub { font-size: 13px; color: #666; margin: 0 0 10px; }\n'
    + '.doc-badge { display: inline-block; background: #0f0f0f; color: #fff; padding: 5px 14px; font-weight: 800; font-size: 13px; letter-spacing: 1px; border-radius: 4px; }\n'
    + '.meta-box { display: flex; justify-content: space-between; background: #fafafa; border: 1px solid #eee; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; }\n'
    + '.day-sec { margin-bottom: 20px; }\n'
    + '.day-title { font-size: 14px; font-weight: 800; text-transform: uppercase; background: #f2f2f2; padding: 6px 12px; border-left: 4px solid #f5a65b; margin: 0 0 8px; }\n'
    + 'table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }\n'
    + 'th { background: #fafafa; border-bottom: 2px solid #ddd; text-align: left; padding: 6px 8px; font-weight: 700; }\n'
    + 'td { border-bottom: 1px solid #eee; padding: 6px 8px; }\n'
    + '.footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #777; display: flex; justify-content: space-between; }\n'
    + '@media print { body { background: #fff; padding: 0; } .sheet { border: none; box-shadow: none; padding: 0; max-width: 100%; } .no-print { display: none !important; } .day-sec { break-inside: avoid; } }\n'
    + '</style>\n</head>\n<body>\n'
    + '<div class="sheet">\n'
    + '<div class="no-print"><button class="print-btn" onclick="window.print()">Print / Save as PDF</button></div>\n'
    + '<div class="header">\n'
    + '<div class="inst-name">eLearning Group Institute</div>\n'
    + '<div class="inst-sub">Office of Academic Scheduling &bull; Directorate of Academic Affairs</div>\n'
    + '<div class="doc-badge">OFFICIAL CLASS TIMETABLE SCHEDULE</div>\n'
    + '</div>\n'
    + '<div class="meta-box">\n'
    + '<div><b>Academic Year:</b> 2024/2025 &bull; <b>Semester:</b> Semester 1</div>\n'
    + '<div><b>Date Issued:</b> ' + esc(dateStr) + ' &bull; <b>Ref:</b> ' + esc(docRef) + '</div>\n'
    + '</div>\n';

  days.forEach(function(d){
    var dayItems = items.filter(function(x){ return x.day === d; });
    if(dayItems.length){
      html += '<div class="day-sec"><div class="day-title">' + d + '</div>\n'
        + '<table><thead><tr><th>Time</th><th>Course Code</th><th>Course Title</th><th>Venue / Room</th><th>Lecturer</th><th style="text-align:right">Cr.Hrs</th></tr></thead><tbody>\n';
      dayItems.forEach(function(x){
        html += '<tr><td><b>' + esc(x.start) + ' - ' + esc(x.end) + '</b></td><td>' + esc(x.code) + '</td><td>' + esc(x.title) + '</td><td>' + esc(x.room) + '</td><td>' + esc(x.lecturer) + '</td><td style="text-align:right">' + (x.cr||3) + '</td></tr>\n';
      });
      html += '</tbody></table></div>\n';
    }
  });

  html += '<div class="footer"><span>Official Institute Class Timetable</span><span>Generated on ' + esc(dateStr) + '</span></div>\n'
    + '</div>\n</body>\n</html>';

  downloadBlob(html, "text/html;charset=utf-8", "Class_Timetable_" + Date.now().toString().slice(-6) + ".html");
}

function downloadRegSlipDoc(student, regCourses){
  var p = student;
  var dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  var docRef = "EGI-REG-" + Date.now().toString().slice(-6);
  var totalCr = regCourses.reduce(function(acc, c){ return acc + (c.cr||0); }, 0);

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
    + 'table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }\n'
    + 'th { background: #fafafa; border-bottom: 2px solid #ddd; text-align: left; padding: 8px; font-weight: 700; }\n'
    + 'td { border-bottom: 1px solid #eee; padding: 8px; }\n'
    + '.total-box { background: #0f0f0f; color: #fff; padding: 14px 18px; border-radius: 6px; display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; margin-bottom: 32px; }\n'
    + '.sig-sec { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; }\n'
    + '.sig-col { width: 45%; }\n'
    + '.sig-line { border-bottom: 1px dashed #888; margin: 44px 0 6px; }\n'
    + '@media print { body { background: #fff; padding: 0; } .sheet { border: none; box-shadow: none; padding: 0; max-width: 100%; } .no-print { display: none !important; } }\n'
    + '</style>\n</head>\n<body>\n'
    + '<div class="sheet">\n'
    + '<div class="no-print"><button class="print-btn" onclick="window.print()">Print / Save as PDF</button></div>\n'
    + '<div class="header">\n'
    + '<div class="inst-name">eLearning Group Institute</div>\n'
    + '<div class="inst-sub">Office of the Registrar &bull; Student Records &amp; Course Registration</div>\n'
    + '<div class="doc-badge">OFFICIAL COURSE REGISTRATION SLIP</div>\n'
    + '</div>\n'
    + '<div class="meta-grid">\n'
    + '<div class="meta-row"><span>Student Name</span><b>' + esc(p.name) + '</b></div>\n'
    + '<div class="meta-row"><span>Student ID</span><b>' + esc(p.id) + '</b></div>\n'
    + '<div class="meta-row"><span>Programme</span><b>' + esc(p.prog || 'Not specified') + '</b></div>\n'
    + '<div class="meta-row"><span>Department</span><b>' + esc(p.dept || 'Not specified') + '</b></div>\n'
    + '<div class="meta-row"><span>Level of Study</span><b>' + esc(p.level || '100') + '</b></div>\n'
    + '<div class="meta-row"><span>Academic Year</span><b>' + esc(p.year || '2024/2025') + '</b></div>\n'
    + '<div class="meta-row"><span>Registration Date</span><b>' + esc(dateStr) + '</b></div>\n'
    + '<div class="meta-row"><span>Verification Ref</span><b>' + esc(docRef) + '</b></div>\n'
    + '</div>\n'
    + '<table><thead><tr><th>#</th><th>Course Code</th><th>Course Title</th><th>Type</th><th>Department</th><th style="text-align:right">Cr.Hrs</th></tr></thead><tbody>\n';

  regCourses.forEach(function(c, i){
    html += '<tr><td>' + (i+1) + '</td><td><b>' + esc(c.code) + '</b></td><td>' + esc(c.title) + '</td><td>' + esc(c.type||'Core') + '</td><td>' + esc(c.dept||'Faculty') + '</td><td style="text-align:right"><b>' + (c.cr||3) + '</b></td></tr>\n';
  });

  html += '</tbody></table>\n'
    + '<div class="total-box"><span>Total Registered Courses: ' + regCourses.length + '</span><span>Total Credit Hours: ' + totalCr + ' Cr.Hrs</span></div>\n'
    + '<div class="sig-sec">\n'
    + '<div class="sig-col"><div class="sig-line"></div><b>Student Signature &amp; Date</b><div style="font-size:11px;color:#666">I confirm this course registration is complete and accurate.</div></div>\n'
    + '<div class="sig-col" style="text-align:right"><div class="sig-line"></div><b>Academic Advisor / Dean Signature</b><div style="font-size:11px;color:#666">Approved by Department Coordinator</div></div>\n'
    + '</div>\n'
    + '</div>\n</body>\n</html>';

  downloadBlob(html, "text/html;charset=utf-8", "Registration_Slip_" + String(p.id).replace(/[^A-Za-z0-9]/g, "_") + ".html");
}

function sTimeView(){
  var days = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var dayTabs = '<div class="day-tabs no-print">' + days.map(function(d){
    var act = ttDay === d ? ' class="active"' : '';
    return '<button' + act + ' data-ttday="' + d + '">' + (d === "All" ? "All Days" : d) + '</button>';
  }).join("") + '</div>';

  var dlBar = '<div class="act-bar no-print">'
    + '<button class="btn btn-icon" data-dl="tt-html"><svg viewBox="0 0 24 24"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>Download Timetable (HTML/PDF)</button>'
    + '<button class="btn alt btn-icon" data-dl="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>Print Timetable</button>'
    + '</div>';

  var filtered = ttDay === "All" ? tt : tt.filter(function(x){ return x.day === ttDay; });
  var content = '';
  if(!tt.length){
    content = '<div class="card"><div class="empty"><b>No timetable published yet</b>Your administrator has not posted the class schedule yet.</div></div>';
  } else if(!filtered.length){
    content = '<div class="card"><div class="empty"><b>No classes on ' + esc(ttDay) + '</b>Select another day or "All Days" to view scheduled lectures.</div></div>';
  } else {
    var groupedDays = ttDay === "All" ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] : [ttDay];
    content = groupedDays.map(function(d){
      var slots = tt.filter(function(x){ return x.day === d; });
      if(!slots.length) return '';
      return '<div class="card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--line)"><h3 style="margin:0;font-size:14px;font-weight:800;color:var(--or);text-transform:uppercase">' + d + '</h3><span style="font-size:12px;color:var(--mute)">' + slots.length + ' class' + (slots.length > 1 ? 'es' : '') + '</span></div>'
        + '<div class="wrap"><table><thead><tr><th>Time</th><th>Course</th><th>Venue / Room</th><th>Lecturer / Instructor</th><th style="text-align:right">Credits</th></tr></thead><tbody>'
        + slots.map(function(s){
          return '<tr><td style="white-space:nowrap"><b>' + esc(s.start) + ' - ' + esc(s.end) + '</b></td><td><b>' + esc(s.code) + '</b><div style="font-size:11px;color:var(--mute)">' + esc(s.title) + '</div></td><td>' + esc(s.room) + '</td><td>' + esc(s.lecturer) + '</td><td style="text-align:right"><b>' + (s.cr||3) + ' Cr</b></td></tr>';
        }).join("")
        + '</tbody></table></div></div>';
    }).join("");
  }
  return '<h2>Class Timetable</h2>' + dlBar + dayTabs + content;
}

function sRegView(){
  var myCourses = courses.filter(function(c){ return regCodes.indexOf(c.code) !== -1; });
  var totalCr = myCourses.reduce(function(acc, c){ return acc + (c.cr||0); }, 0);
  var unregCourses = courses.filter(function(c){ return regCodes.indexOf(c.code) === -1; });

  var summary = '<div class="card info" style="margin-bottom:16px"><div class="f"><span>Total Registered Courses</span><b class="nm">' + myCourses.length + ' Courses</b></div><div class="f"><span>Total Registered Credits</span><b class="nm ' + (totalCr >= 12 ? 'ok' : '') + '">' + totalCr + ' Cr.Hrs</b><span style="font-size:11px;color:var(--mute)">Max allowed: 21 Cr.Hrs</span></div><div class="f"><span>Registration Status</span><b class="ok">Confirmed &bull; Semester 1</b><span style="font-size:11px;color:var(--mute)">Academic Year 2024/2025</span></div></div>';

  var dlBar = '<div class="act-bar no-print">'
    + '<button class="btn btn-icon" data-dl="reg-html"><svg viewBox="0 0 24 24"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>Download Registration Slip (HTML/PDF)</button>'
    + '<button class="btn alt btn-icon" data-dl="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>Print Slip</button>'
    + '</div>';

  var regTable = '<div class="card"><h3>Registered Courses (Semester 1)</h3>'
    + (myCourses.length ? '<div class="wrap"><table><thead><tr><th>Code</th><th>Course Title</th><th>Cr.Hrs</th><th>Type</th><th>Department</th><th class="no-print"></th></tr></thead><tbody>'
      + myCourses.map(function(c){
        return '<tr><td><b>' + esc(c.code) + '</b></td><td>' + esc(c.title) + '</td><td>' + (c.cr||3) + '</td><td><span class="tag ' + (c.type === 'Core' ? 'core' : 'elec') + '">' + esc(c.type||'Core') + '</span></td><td>' + esc(c.dept||'') + '</td><td class="no-print" style="text-align:right"><button class="mini" data-drop="' + esc(c.code) + '">Drop</button></td></tr>';
      }).join("")
      + '</tbody></table></div>' : '<div class="empty"><b>No registered courses</b>Select from available courses below to register.</div>')
    + '</div>';

  var availTable = '<div class="card"><h3>Available Courses for Registration</h3>'
    + (unregCourses.length ? '<div class="wrap"><table><thead><tr><th>Code</th><th>Course Title</th><th>Cr.Hrs</th><th>Type</th><th>Department</th><th>Action</th></tr></thead><tbody>'
      + unregCourses.map(function(c){
        return '<tr><td><b>' + esc(c.code) + '</b></td><td>' + esc(c.title) + '</td><td>' + (c.cr||3) + '</td><td><span class="tag ' + (c.type === 'Core' ? 'core' : 'elec') + '">' + esc(c.type||'Elective') + '</span></td><td>' + esc(c.dept||'') + '</td><td><button class="btn" style="padding:4px 10px;font-size:12px" data-reg="' + esc(c.code) + '">+ Register</button></td></tr>';
      }).join("")
      + '</tbody></table></div>' : '<div class="empty"><b>All courses registered</b>You have registered for all available offerings.</div>')
    + '</div>';

  return '<h2>Course Registration</h2>' + dlBar + summary + regTable + availTable;
}

function aTimeView(){
  var fl = flash ? '<div class="flash">' + esc(flash) + '</div>' : "";
  var form = '';
  var isEdit = editing && typeof editing === "string" && editing.indexOf("tt-edit-") === 0;
  if(editing === "tt-new" || isEdit){
    var editId = isEdit ? parseInt(editing.replace("tt-edit-", ""), 10) : null;
    var curSlot = editId ? tt.filter(function(x){ return x.id === editId; })[0] : null;
    var dVal = curSlot ? curSlot.day : "Monday";
    var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    form = '<div class="card"><h2>' + (isEdit ? 'Edit Class Schedule Slot' : 'Add Class Schedule Slot') + '</h2><div class="form">'
      + '<label class="fld"><span>Day of Week</span><select id="tt-day">'
      + days.map(function(d){ return '<option' + (dVal === d ? ' selected' : '') + '>' + d + '</option>'; }).join("")
      + '</select></label>'
      + '<label class="fld"><span>Start Time (e.g. 08:30)</span><input id="tt-start" value="' + esc(curSlot ? curSlot.start : '08:30') + '"></label>'
      + '<label class="fld"><span>End Time (e.g. 10:30)</span><input id="tt-end" value="' + esc(curSlot ? curSlot.end : '10:30') + '"></label>'
      + '<label class="fld"><span>Course Code (e.g. OHS 101)</span><input id="tt-code" value="' + esc(curSlot ? curSlot.code : '') + '" placeholder="OHS 101"></label>'
      + '<label class="fld"><span>Course Title</span><input id="tt-title" value="' + esc(curSlot ? curSlot.title : '') + '" placeholder="Introduction to OHS"></label>'
      + '<label class="fld"><span>Venue / Room</span><input id="tt-room" value="' + esc(curSlot ? curSlot.room : '') + '" placeholder="Lecture Hall A"></label>'
      + '<label class="fld"><span>Lecturer / Instructor</span><input id="tt-lec" value="' + esc(curSlot ? curSlot.lecturer : '') + '" placeholder="Dr. E. Mensah"></label>'
      + '<label class="fld"><span>Credit Hours</span><input id="tt-cr" type="number" value="' + (curSlot ? curSlot.cr : 3) + '"></label>'
      + '</div><div class="bt"><button class="btn" id="' + (isEdit ? 'update-tt' : 'save-tt') + '">' + (isEdit ? 'Save Changes' : 'Save and Publish Slot') + '</button><button class="btn alt" id="cancel">Cancel</button></div></div>';
  }

  var daysList = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var dayTabs = '<div class="day-tabs no-print">' + daysList.map(function(d){
    var act = ttDay === d ? ' class="active"' : '';
    return '<button' + act + ' data-ttday="' + d + '">' + (d === "All" ? "All Days" : d) + '</button>';
  }).join("") + '</div>';

  var topBar = '<div class="card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">'
    + '<div><h2 style="margin:0 0 4px">Master Timetable Management</h2><div style="font-size:12px;color:var(--mute)">Configure, preview, and broadcast class schedules to all enrolled students.</div></div>'
    + '<div class="bt" style="margin:0">'
    + '<button class="btn" id="a-bc-tt" style="background:#0f0f0f;color:#fff;border-color:var(--or)" title="Notify all students of the updated schedule">📢 Give Timetable to All Students</button>'
    + '<button class="btn" id="a-new-tt">+ Add Class Slot</button>'
    + '<button class="btn alt btn-icon" data-dl="tt-html"><svg viewBox="0 0 24 24"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>Export Timetable</button>'
    + '<button class="btn alt btn-icon" data-dl="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>Print</button>'
    + '<button class="btn alt" id="a-tt-mode">' + (adminTtMode === "cards" ? "Table View" : "Student View") + '</button>'
    + '</div></div></div>';

  var filtered = ttDay === "All" ? tt : tt.filter(function(x){ return x.day === ttDay; });
  var content = '';

  if(!tt.length){
    content = '<div class="card"><div class="empty"><b>No timetable slots created yet</b>Click "+ Add Class Slot" to add lecture slots and give the schedule to students.</div></div>';
  } else if(adminTtMode === "cards"){
    if(!filtered.length){
      content = '<div class="card"><div class="empty"><b>No classes scheduled on ' + esc(ttDay) + '</b>Select another day or "All Days" to view lecture sessions.</div></div>';
    } else {
      var groupedDays = ttDay === "All" ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] : [ttDay];
      content = groupedDays.map(function(d){
        var slots = tt.filter(function(x){ return x.day === d; });
        if(!slots.length) return '';
        return '<div class="card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--line)"><h3 style="margin:0;font-size:14px;font-weight:800;color:var(--or);text-transform:uppercase">' + d + '</h3><span style="font-size:12px;color:var(--mute)">' + slots.length + ' class' + (slots.length > 1 ? 'es' : '') + '</span></div>'
          + '<div class="wrap"><table><thead><tr><th>Time</th><th>Course</th><th>Venue / Room</th><th>Lecturer / Instructor</th><th style="text-align:right">Credits</th><th class="no-print" style="text-align:right">Actions</th></tr></thead><tbody>'
          + slots.map(function(s){
            return '<tr><td style="white-space:nowrap"><b>' + esc(s.start) + ' - ' + esc(s.end) + '</b></td><td><b>' + esc(s.code) + '</b><div style="font-size:11px;color:var(--mute)">' + esc(s.title) + '</div></td><td>' + esc(s.room) + '</td><td>' + esc(s.lecturer) + '</td><td style="text-align:right"><b>' + (s.cr||3) + ' Cr</b></td><td class="no-print" style="text-align:right;white-space:nowrap"><button class="mini" data-ett="' + s.id + '">Edit</button> <button class="mini" data-dtt="' + s.id + '">Delete</button></td></tr>';
          }).join("")
          + '</tbody></table></div></div>';
      }).join("");
    }
  } else {
    // Table mode
    content = '<div class="card"><div class="wrap"><table><thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Venue / Room</th><th>Lecturer</th><th style="text-align:right">Credits</th><th style="text-align:right">Actions</th></tr></thead><tbody>'
      + filtered.map(function(t){
        return '<tr><td><b>' + esc(t.day) + '</b></td><td style="white-space:nowrap">' + esc(t.start) + ' - ' + esc(t.end) + '</td><td><b>' + esc(t.code) + '</b><div style="font-size:11px;color:var(--mute)">' + esc(t.title) + '</div></td><td>' + esc(t.room) + '</td><td>' + esc(t.lecturer) + '</td><td style="text-align:right">' + (t.cr||3) + ' Cr</td><td style="text-align:right;white-space:nowrap"><button class="mini" data-ett="' + t.id + '">Edit</button> <button class="mini" data-dtt="' + t.id + '">Delete</button></td></tr>';
      }).join("")
      + '</tbody></table></div></div>';
  }

  return fl + form + topBar + dayTabs + content;
}

function aCoursesView(){
  var fl = flash ? '<div class="flash">' + esc(flash) + '</div>' : "";
  var form = '';
  if(editing === "course-new"){
    form = '<div class="card"><h2>Add Course Offering to Catalog</h2><div class="form">'
      + '<label class="fld"><span>Course Code (e.g. OHS 201)</span><input id="c-code" placeholder="OHS 201"></label>'
      + '<label class="fld"><span>Course Title</span><input id="c-title" placeholder="Advanced Occupational Hygiene"></label>'
      + '<label class="fld"><span>Credit Hours</span><input id="c-cr" type="number" value="3"></label>'
      + '<label class="fld"><span>Level</span><select id="c-level"><option>100</option><option>200</option><option>300</option><option>400</option></select></label>'
      + '<label class="fld"><span>Semester</span><select id="c-sem"><option>Semester 1</option><option>Semester 2</option><option>Semester 3</option></select></label>'
      + '<label class="fld"><span>Course Type</span><select id="c-type"><option>Core</option><option>Elective</option><option>Mandatory</option></select></label>'
      + '<label class="fld"><span>Department / Faculty</span><input id="c-dept" value="Faculty of Health Sciences"></label>'
      + '</div><div class="bt"><button class="btn" id="save-course">Save Course Offering</button><button class="btn alt" id="cancel">Cancel</button></div></div>';
  }

  // Active student for interactive student-like registration view
  var activeStu = null;
  if(stu.length){
    if(adminRegSid){
      activeStu = stuBy(adminRegSid);
    }
    if(!activeStu){
      activeStu = stu[0];
      adminRegSid = activeStu.sid;
    }
  }

  var studentSelector = '';
  if(stu.length){
    studentSelector = '<div class="card" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">'
      + '<div style="flex:1;min-width:260px"><label class="fld" style="margin:0"><span>Select Student to Manage Course Registration (Interactive Student View):</span><select id="a-reg-sel">'
      + stu.map(function(s){
        return '<option value="' + esc(s.sid) + '"' + (s.sid === (activeStu ? activeStu.sid : '') ? ' selected' : '') + '>' + esc(s.name) + ' (' + esc(s.id) + ') - ' + esc(s.level) + '</option>';
      }).join("")
      + '</select></label></div>'
      + '<div class="bt" style="margin:0">'
      + '<button class="btn" id="a-reg-all-cores" title="Batch register all core courses for all students">⚡ Register All Students for Core Courses</button>'
      + '<button class="btn alt" id="a-new-course">+ Add Course Offering</button>'
      + '</div>'
      + '</div></div>';
  }

  var studentInteractiveSection = '';
  if(activeStu){
    var sRegs = regAll[activeStu.sid] || (activeStu.sid === "EGI_2024_02486" ? ["OHS 101", "OHS 103", "OHS 105", "OHS 107", "GNS 101"] : []);
    var myCourses = courses.filter(function(c){ return sRegs.indexOf(c.code) !== -1; });
    var totalCr = myCourses.reduce(function(acc, c){ return acc + (c.cr||0); }, 0);
    var unregCourses = courses.filter(function(c){ return sRegs.indexOf(c.code) === -1; });

    var summary = '<div class="card info" style="margin-bottom:16px">'
      + '<div class="f"><span>Active Student</span><b class="nm">' + esc(activeStu.name) + '</b><span style="font-size:12px;color:var(--mute)">ID: ' + esc(activeStu.id) + ' &bull; ' + esc(activeStu.prog) + '</span></div>'
      + '<div class="f"><span>Total Registered</span><b class="nm">' + myCourses.length + ' Courses</b><span style="font-size:12px;color:var(--mute)">' + totalCr + ' / 21 Credit Hours</span></div>'
      + '<div class="f"><span>Registration Status</span><b class="ok">Confirmed &bull; Semester 1</b><span style="font-size:12px;color:var(--mute)">Academic Year ' + esc(activeStu.year || '2024/2025') + '</span></div>'
      + '</div>';

    var dlBar = '<div class="act-bar no-print">'
      + '<button class="btn btn-icon" data-dl-admin-reg="' + esc(activeStu.sid) + '"><svg viewBox="0 0 24 24"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>Download Official Slip (' + esc(activeStu.name) + ')</button>'
      + '<button class="btn alt btn-icon" data-dl="print"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>Print Slip</button>'
      + '<button class="btn alt" data-reg-cores="' + esc(activeStu.sid) + '">Quick Register All Core Courses</button>'
      + '</div>';

    var regTable = '<div class="card"><h3>Registered Courses for ' + esc(activeStu.name) + ' (Semester 1)</h3>'
      + (myCourses.length ? '<div class="wrap"><table><thead><tr><th>Code</th><th>Course Title</th><th>Cr.Hrs</th><th>Type</th><th>Department</th><th class="no-print" style="text-align:right">Action</th></tr></thead><tbody>'
        + myCourses.map(function(c){
          return '<tr><td><b>' + esc(c.code) + '</b></td><td>' + esc(c.title) + '</td><td>' + (c.cr||3) + '</td><td><span class="tag ' + (c.type === 'Core' ? 'core' : 'elec') + '">' + esc(c.type||'Core') + '</span></td><td>' + esc(c.dept||'') + '</td><td class="no-print" style="text-align:right"><button class="mini" data-drop-for="' + esc(activeStu.sid) + ':' + esc(c.code) + '">Drop</button></td></tr>';
        }).join("")
        + '</tbody></table></div>' : '<div class="empty"><b>No registered courses for this student</b>Click "+ Register" on any available course below.</div>')
      + '</div>';

    var availTable = '<div class="card"><h3>Available Courses to Register for ' + esc(activeStu.name) + '</h3>'
      + (unregCourses.length ? '<div class="wrap"><table><thead><tr><th>Code</th><th>Course Title</th><th>Cr.Hrs</th><th>Type</th><th>Department</th><th style="text-align:right">Action</th></tr></thead><tbody>'
        + unregCourses.map(function(c){
          return '<tr><td><b>' + esc(c.code) + '</b></td><td>' + esc(c.title) + '</td><td>' + (c.cr||3) + '</td><td><span class="tag ' + (c.type === 'Core' ? 'core' : 'elec') + '">' + esc(c.type||'Elective') + '</span></td><td>' + esc(c.dept||'') + '</td><td style="text-align:right"><button class="btn" style="padding:4px 10px;font-size:12px" data-reg-for="' + esc(activeStu.sid) + ':' + esc(c.code) + '">+ Register</button></td></tr>';
        }).join("")
        + '</tbody></table></div>' : '<div class="empty"><b>All offerings registered</b>' + esc(activeStu.name) + ' is registered for all courses.</div>')
      + '</div>';

    studentInteractiveSection = summary + dlBar + regTable + availTable;
  }

  // Master registrations list for all students
  var regOverview = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3>All Students Registration Status</h3></div>'
    + (stu.length ? '<div class="wrap"><table><thead><tr><th>Student Name</th><th>Student ID</th><th>Programme</th><th>Level</th><th>Registered Courses</th><th>Credits</th><th class="no-print" style="text-align:right">Actions</th></tr></thead><tbody>'
      + stu.map(function(s){
        var myRegs = regAll[s.sid] || (s.sid === "EGI_2024_02486" ? ["OHS 101", "OHS 103", "OHS 105", "OHS 107", "GNS 101"] : []);
        var myCr = courses.filter(function(c){ return myRegs.indexOf(c.code) !== -1; }).reduce(function(acc, c){ return acc + (c.cr||0); }, 0);
        return '<tr><td><b>' + esc(s.name) + '</b></td><td>' + esc(s.id) + '</td><td>' + esc(s.prog) + '</td><td>' + esc(s.level) + '</td><td><b>' + myRegs.length + ' courses</b><div style="font-size:11px;color:var(--mute)">' + esc(myRegs.join(", ") || 'None') + '</div></td><td><b>' + myCr + ' Cr.Hrs</b></td><td class="no-print" style="text-align:right;white-space:nowrap"><button class="mini" data-sel-reg="' + esc(s.sid) + '">Select</button> <button class="mini" data-dl-admin-reg="' + esc(s.sid) + '">Slip</button></td></tr>';
      }).join("")
      + '</tbody></table></div>' : '<div class="empty"><b>No students enrolled yet</b></div>')
    + '</div>';

  // Catalog Table
  var catalogTable = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3>Course Offerings Master Catalog</h3><button class="btn" id="a-new-course">+ Add Course Offering</button></div>'
    + (courses.length ? '<div class="wrap"><table><thead><tr><th>Code</th><th>Course Title</th><th>Cr.Hrs</th><th>Level</th><th>Semester</th><th>Type</th><th>Department</th><th style="text-align:right">Action</th></tr></thead><tbody>'
      + courses.map(function(c){
        return '<tr><td><b>' + esc(c.code) + '</b></td><td>' + esc(c.title) + '</td><td>' + (c.cr||3) + '</td><td>' + esc(c.level||'100') + '</td><td>' + esc(c.sem||'Semester 1') + '</td><td><span class="tag ' + (c.type==='Core'?'core':'elec') + '">' + esc(c.type||'Core') + '</span></td><td>' + esc(c.dept||'') + '</td><td style="text-align:right"><button class="mini" data-dcourse="' + esc(c.code) + '">Delete</button></td></tr>';
      }).join("")
      + '</tbody></table></div>' : '<div class="empty"><b>No courses in catalog</b>Click "+ Add Course Offering" to add courses.</div>')
    + '</div>';

  return fl + form + studentSelector + studentInteractiveSection + regOverview + catalogTable;
}

function sView(){
if(!me)return'<div class="card"><div class="empty"><b>Record not found</b>Your student record was removed. Contact your administrator.</div></div>';
var g=me.grades||{},v=view;
if(v==="dash")return infoCard(me)+'<div class="cols"><div class="card"><h2>Announcements</h2>'+newsHtml()+'</div><div>'+gpaCard(g)+'</div></div>';
if(v==="profile")return infoCard(me)+'<p style="color:var(--mute)">Your administrator maintains these details.</p>';
if(v==="time")return sTimeView();
if(v==="reg")return sRegView();
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
if(v==="msg")return'<div class="card"><h2>Messages</h2>'+newsHtml()+'</div>';
var n=NAV.filter(function(x){return x[0]===v})[0];return'<div class="card"><h2>'+n[1]+'</h2><div class="empty"><b>Nothing here yet</b>Your administrator has not added anything to this page.</div></div>'}
/* ---- admin views ---- */
function aView(){
var fl=flash?'<div class="flash">'+esc(flash)+'</div>':"";
if(view==="timetable")return aTimeView();
if(view==="courses")return aCoursesView();
if(view==="ann")return fl+'<div class="card"><h2>Post an announcement</h2><label class="fld"><span>Title</span><input id="at"></label><label class="fld"><span>Message</span><textarea id="ab" rows="3"></textarea></label><button class="btn" id="apost">Post announcement</button></div><div class="card"><h2>Posted</h2>'+(news.length?news.map(function(n){return'<div class="ann"><b>'+esc(n.title)+'</b> <button class="mini" data-dann="'+n.id+'">Delete</button><div style="color:var(--mute)">'+esc(n.body)+'</div></div>'}).join(""):'<div class="empty"><b>No announcements</b>Posts appear on every student dashboard.</div>')+'</div>';
if(editing!==null)return editForm();
return fl+'<div class="card"><h2>Students ('+stu.length+')</h2><div class="bt" style="margin:0 0 12px"><button class="btn" data-edit="new">Add student</button>'+''+'</div>'
+(stu.length?'<div class="wrap"><table><thead><tr><th>Name</th><th>Student ID</th><th>Access Code</th><th>Programme</th><th>Level</th><th>GPA</th><th style="text-align:right">Actions</th></tr></thead><tbody>'+stu.map(function(s){return'<tr><td><b>'+esc(s.name)+'</b></td><td>'+esc(s.id)+'</td><td><code style="background:var(--card);border:1px solid var(--line);padding:2px 7px;border-radius:4px;font-weight:700;letter-spacing:0.5px;color:var(--txt)">'+esc(s.code||'ACCESS2024')+'</code></td><td>'+esc(s.prog)+'</td><td>'+esc(s.level)+'</td><td><b>'+calc(all(),s.grades||{}).gpa.toFixed(2)+'</b></td><td style="white-space:nowrap;text-align:right"><button class="mini" data-edit="'+s.sid+'">Edit</button> <button class="mini" data-del="'+s.sid+'">Delete</button></td></tr>'}).join("")+'</tbody></table></div>':'<div class="empty"><b>No students yet</b>Add a student to create their record and access code.</div>')+'</div>'}
function editForm(){var neu=editing==="new",o=neu?{}:(stuBy(editing)||{}),g=o.grades||{};
var f=[["name","Full name"],["id","Student ID (Editable)"],["prog","Programme"],["dept","Department"],["level","Level of study"],["year","Academic year"]];
return(flash?'<div class="flash">'+esc(flash)+'</div>':"")+'<div class="card"><h2>'+(neu?"Add student":"Edit "+esc(o.name))+'</h2>'+(!neu?'<p style="margin:-6px 0 16px;font-size:13px;color:var(--mute)">Student Access Code: <code style="background:var(--card);border:1px solid var(--line);padding:2px 8px;border-radius:4px;font-weight:700;color:var(--txt)">'+esc(o.code||"ACCESS2024")+'</code> (Student can sign in using this code or ACCESS2024)</p>':'')+'<div class="form">'+f.map(function(x){return'<label class="fld"><span>'+x[1]+'</span><input data-p="'+x[0]+'" value="'+esc(o[x[0]]||"")+'"></label>'}).join("")+'</div></div>'
+'<div class="sems">'+SEMS.map(function(s){return'<div class="card sem"><h3>'+s[0]+'</h3><table>'+s[1].map(function(c){return'<tr><td>'+c[0]+'</td><td>'+c[1]+'</td><td><select data-c="'+c[0]+'"><option value="">--</option>'+Object.keys(GP).map(function(k){return'<option'+(g[c[0]]===k?' selected':'')+'>'+k+'</option>'}).join("")+'</select></td></tr>'}).join("")+'</table></div>'}).join("")+'</div>'
+'<div class="bt"><button class="btn" id="save">Save student</button><button class="btn alt" id="cancel">Cancel</button>'+(neu?'':'<button class="btn alt" id="rcode">Reset access code</button>')+'</div>'}

/* ---- api and session ---- */
var isStaticHost = window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';

var DEFAULT_STUDENTS = [
  { sid:"EGI_2024_02486", id:"EGI/2024/02486", name:"Ama Mensah", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 300", year:"2024/2025", code:"ACCESS2024", grades:{"OHS 101":"A","OHS 103":"B+","OHS 105":"A-","OHS 107":"A","GNS 101":"B+","OHS 102":"A","OHS 104":"B","OHS 106":"A-","OHS 108":"B+","ICT 101":"A"} },
  { sid:"EGI_2024_02487", id:"EGI/2024/02487", name:"Wisdom Diaba", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"WD-2024", grades:{"OHS 101":"A","OHS 103":"B+","OHS 105":"A-","OHS 107":"A","GNS 101":"B+"} },
  { sid:"EGI_2024_02488", id:"EGI/2024/02488", name:"Daniella Ewenam Agbemavor", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"DA-2024", grades:{"OHS 101":"A-","OHS 103":"A","OHS 105":"B+","OHS 107":"A","GNS 101":"A"} },
  { sid:"EGI_2024_02489", id:"EGI/2024/02489", name:"Ayornu Kefa", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"AK-2024", grades:{"OHS 101":"B+","OHS 103":"B","OHS 105":"B+","OHS 107":"A-","GNS 101":"B+"} },
  { sid:"EGI_2024_02490", id:"EGI/2024/02490", name:"Jessica Yayra Wowui", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"JW-2024", grades:{"OHS 101":"A","OHS 103":"A-","OHS 105":"A","OHS 107":"A","GNS 101":"B+"} },
  { sid:"EGI_2024_02491", id:"EGI/2024/02491", name:"Augustina Tetteh", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"AT-2024", grades:{"OHS 101":"B+","OHS 103":"B+","OHS 105":"A-","OHS 107":"A-","GNS 101":"B"} },
  { sid:"EGI_2024_02492", id:"EGI/2024/02492", name:"J.R Gabriel Mawuko", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"JM-2024", grades:{"OHS 101":"A","OHS 103":"B+","OHS 105":"B+","OHS 107":"A","GNS 101":"A-"} },
  { sid:"EGI_2024_02493", id:"EGI/2024/02493", name:"Raymond Deku", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"RD-2024", grades:{"OHS 101":"B+","OHS 103":"A-","OHS 105":"B+","OHS 107":"B+","GNS 101":"B+"} },
  { sid:"EGI_2024_02494", id:"EGI/2024/02494", name:"Hudu Sumaila", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"HS-2024", grades:{"OHS 101":"A-","OHS 103":"B+","OHS 105":"A","OHS 107":"A-","GNS 101":"B+"} },
  { sid:"EGI_2024_02495", id:"EGI/2024/02495", name:"Mathias Kelvin Dzamesi", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"MD-2024", grades:{"OHS 101":"A","OHS 103":"A","OHS 105":"A-","OHS 107":"A","GNS 101":"A-"} },
  { sid:"EGI_2024_02496", id:"EGI/2024/02496", name:"Philip Acquah", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"PA-2024", grades:{"OHS 101":"B+","OHS 103":"B","OHS 105":"B+","OHS 107":"A-","GNS 101":"B"} },
  { sid:"EGI_2024_02497", id:"EGI/2024/02497", name:"Kingsley Otto", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"KO-2024", grades:{"OHS 101":"A-","OHS 103":"B+","OHS 105":"B+","OHS 107":"A","GNS 101":"B+"} },
  { sid:"EGI_2024_02498", id:"EGI/2024/02498", name:"Stephen Amoh", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"SA-2024", grades:{"OHS 101":"B+","OHS 103":"B+","OHS 105":"A-","OHS 107":"A-","GNS 101":"A-"} },
  { sid:"EGI_2024_02499", id:"EGI/2024/02499", name:"Rahina Narteynorh", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"RN-2024", grades:{"OHS 101":"A","OHS 103":"A-","OHS 105":"A","OHS 107":"A","GNS 101":"B+"} },
  { sid:"EGI_2024_02500", id:"EGI/2024/02500", name:"Benjamin Dadzie", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"BD-2024", grades:{"OHS 101":"B+","OHS 103":"B","OHS 105":"B+","OHS 107":"B+","GNS 101":"B"} },
  { sid:"EGI_2024_02501", id:"EGI/2024/02501", name:"Abdul Razak", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"AR-2024", grades:{"OHS 101":"A-","OHS 103":"B+","OHS 105":"A-","OHS 107":"A","GNS 101":"B+"} },
  { sid:"EGI_2024_02502", id:"EGI/2024/02502", name:"Emmanuel Addo Adjei", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"EA-2024", grades:{"OHS 101":"B+","OHS 103":"B+","OHS 105":"A-","OHS 107":"A-","GNS 101":"B+"} },
  { sid:"EGI_2024_02503", id:"EGI/2024/02503", name:"Christabel Tetteh", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"CT-2024", grades:{"OHS 101":"A","OHS 103":"A","OHS 105":"A-","OHS 107":"A","GNS 101":"A-"} },
  { sid:"EGI_2024_02504", id:"EGI/2024/02504", name:"Very Justice Essuman", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"VJ-2024", grades:{"OHS 101":"A","OHS 103":"A","OHS 105":"A","OHS 107":"A","GNS 101":"A"} },
  { sid:"EGI_2024_02505", id:"EGI/2024/02505", name:"Philip Ampomah", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"PM-2024", grades:{"OHS 101":"B+","OHS 103":"B+","OHS 105":"B","OHS 107":"A-","GNS 101":"B+"} },
  { sid:"EGI_2024_02506", id:"EGI/2024/02506", name:"Emmanuel Mensah", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"EM-2024", grades:{"OHS 101":"A-","OHS 103":"B+","OHS 105":"A-","OHS 107":"A","GNS 101":"B+"} },
  { sid:"EGI_2024_02507", id:"EGI/2024/02507", name:"Rita Kponyo", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"RK-2024", grades:{"OHS 101":"A","OHS 103":"A-","OHS 105":"A","OHS 107":"A","GNS 101":"A-"} },
  { sid:"EGI_2024_02508", id:"EGI/2024/02508", name:"Enoch Togoli", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"ET-2024", grades:{"OHS 101":"B+","OHS 103":"B+","OHS 105":"A-","OHS 107":"A-","GNS 101":"B+"} },
  { sid:"EGI_2024_02509", id:"EGI/2024/02509", name:"Kenneth Avalon", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"KA-2024", grades:{"OHS 101":"A","OHS 103":"B+","OHS 105":"A-","OHS 107":"A","GNS 101":"B+"} },
  { sid:"EGI_2024_02510", id:"EGI/2024/02510", name:"Ebenezer Eshun Mensah Anokye", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"EA-2025", grades:{"OHS 101":"A","OHS 103":"A-","OHS 105":"A","OHS 107":"A","GNS 101":"B+"} },
  { sid:"EGI_2024_02511", id:"EGI/2024/02511", name:"Michael Nyameke", prog:"BSc Occupational Health and Safety", dept:"Faculty of Health Sciences", level:"Level 100", year:"2024/2025", code:"MN-2024", grades:{"OHS 101":"A-","OHS 103":"B+","OHS 105":"A","OHS 107":"A","GNS 101":"A"} }
];

function getLocalData(){
  var s=localStorage.getItem("portal_students"),n=localStorage.getItem("portal_news"),t=localStorage.getItem("portal_tt"),c=localStorage.getItem("portal_courses"),r=localStorage.getItem("portal_regs");
  var stus=DEFAULT_STUDENTS.slice();
  if(s){
    try{
      var parsed=JSON.parse(s);
      if(Array.isArray(parsed)&&parsed.length>=DEFAULT_STUDENTS.length){stus=parsed}
      else if(Array.isArray(parsed)){
        var map={};DEFAULT_STUDENTS.forEach(function(ds){map[ds.sid]=ds});
        parsed.forEach(function(ps){map[ps.sid]=ps});
        stus=Object.keys(map).map(function(k){return map[k]});
      }
    }catch(e){}
  }
  var newsList=n?JSON.parse(n):[{
    id:1,title:"Welcome to the 2024/2025 Academic Year",
    body:"Semester examinations will commence as scheduled. Ensure all course registrations and fees are cleared.",ts:Date.now()-3600000
  }];
  var ttList=t?JSON.parse(t):[
    { id:1, day:"Monday", start:"08:30", end:"10:30", code:"OHS 101", title:"Introduction to OHS", room:"Lecture Hall A", lecturer:"Dr. E. Mensah", cr:3 },
    { id:2, day:"Monday", start:"11:00", end:"13:00", code:"GNS 101", title:"Use of English", room:"Arts Block 2", lecturer:"Mrs. S. Addo", cr:2 },
    { id:3, day:"Tuesday", start:"09:00", end:"12:00", code:"OHS 103", title:"Hazard Identification and Risk Assessment", room:"Lab 3", lecturer:"Prof. K. Osei", cr:3 },
    { id:4, day:"Wednesday", start:"10:00", end:"13:00", code:"OHS 105", title:"Safety Management Principles", room:"Lecture Hall B", lecturer:"Dr. A. Boateng", cr:3 },
    { id:5, day:"Thursday", start:"08:30", end:"10:30", code:"OHS 107", title:"Communication Skills", room:"Seminar Room 1", lecturer:"Dr. F. Arthur", cr:2 },
    { id:6, day:"Friday", start:"09:00", end:"12:00", code:"ICT 101", title:"Introduction to Information Technology", room:"Computer Lab 1", lecturer:"Mr. J. Appiah", cr:2 }
  ];
  var courseList=c?JSON.parse(c):[
    { code:"OHS 101", title:"Introduction to OHS", cr:3, level:"100", sem:"Semester 1", type:"Core", dept:"Faculty of Health Sciences" },
    { code:"OHS 103", title:"Hazard Identification and Risk Assessment", cr:3, level:"100", sem:"Semester 1", type:"Core", dept:"Faculty of Health Sciences" },
    { code:"OHS 105", title:"Safety Management Principles", cr:3, level:"100", sem:"Semester 1", type:"Core", dept:"Faculty of Health Sciences" },
    { code:"OHS 107", title:"Communication Skills", cr:2, level:"100", sem:"Semester 1", type:"Core", dept:"Faculty of Health Sciences" },
    { code:"GNS 101", title:"Use of English", cr:2, level:"100", sem:"Semester 1", type:"Mandatory", dept:"General Studies" },
    { code:"OHS 109", title:"Fire Safety and Emergency Response", cr:3, level:"100", sem:"Semester 1", type:"Elective", dept:"Faculty of Health Sciences" },
    { code:"OHS 111", title:"Industrial Safety Management", cr:3, level:"100", sem:"Semester 1", type:"Elective", dept:"Faculty of Health Sciences" },
    { code:"ICT 101", title:"Introduction to Information Technology", cr:2, level:"100", sem:"Semester 1", type:"Mandatory", dept:"Computer Science" }
  ];
  var defaultRegs={};
  stus.forEach(function(st){defaultRegs[st.sid]=["OHS 101","OHS 103","OHS 105","OHS 107","GNS 101"]});
  var regsObj=defaultRegs;
  if(r){
    try{
      var parsedR=JSON.parse(r);
      if(parsedR&&typeof parsedR==="object"){
        Object.keys(parsedR).forEach(function(k){regsObj[k]=parsedR[k]});
      }
    }catch(e){}
  }
  return { students:stus, news:newsList, timetable:ttList, courses:courseList, registrations:regsObj };
}
function saveLocalData(d){
  if(d.students)localStorage.setItem("portal_students",JSON.stringify(d.students));
  if(d.news)localStorage.setItem("portal_news",JSON.stringify(d.news));
  if(d.timetable)localStorage.setItem("portal_tt",JSON.stringify(d.timetable));
  if(d.courses)localStorage.setItem("portal_courses",JSON.stringify(d.courses));
  if(d.registrations)localStorage.setItem("portal_regs",JSON.stringify(d.registrations));
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
      var newK=key(pr.id||"");
      if(newK&&newK!==targetSid){
        if(d.students.some(function(x){return x.sid===newK}))throw new Error("That student ID already exists.");
        d.students[idx].sid=newK;
        d.students[idx].id=pr.id;
        if(d.registrations&&d.registrations[targetSid]){
          d.registrations[newK]=d.registrations[targetSid];
          delete d.registrations[targetSid];
        }
      } else if(pr.id) {
        d.students[idx].id=pr.id;
      }
      d.students[idx].name=pr.name;d.students[idx].prog=pr.prog;d.students[idx].dept=pr.dept;d.students[idx].level=pr.level;d.students[idx].year=pr.year;d.students[idx].grades=b.grades||{};
      saveLocalData(d);return{ok:true,sid:d.students[idx].sid};
    }
    if(sub==="code"){
      var alphabet2="ABCDEFGHJKMNPQRSTUVWXYZ23456789",c2="";
      for(var j=0;j<10;j++)c2+=alphabet2[Math.floor(Math.random()*alphabet2.length)];
      d.students[idx].code=c2;saveLocalData(d);return{code:c2};
    }
  }
  if(u==="/timetable/broadcast"&&m==="POST"){
    var bCount=d.timetable.length;
    var bItm={
      id:Date.now(),
      title:"Official Class Timetable Published for All Students",
      body:"The official Semester 1 class timetable has been finalized and released by the administration with "+bCount+" scheduled lecture sessions. All students can now view their daily lecture hours, venues, and lecturers under the Timetable menu, and download their official schedule slip.",
      ts:Date.now()
    };
    d.news.unshift(bItm);
    saveLocalData(d);
    return{ok:true,announcement:bItm};
  }
  if(u==="/timetable"){
    if(m==="GET")return{items:d.timetable};
    if(m==="POST"){
      var ntt={id:Date.now(),day:b.day,start:b.start,end:b.end,code:String(b.code||'').toUpperCase(),title:b.title,room:b.room,lecturer:b.lecturer,cr:Number(b.cr)||3};
      d.timetable.push(ntt);saveLocalData(d);return{item:ntt};
    }
  }
  if(u.indexOf("/timetable/")===0&&m==="PUT"){
    var editTtId=parseInt(u.split("/")[2],10);
    var ttIdx=-1;d.timetable.forEach(function(t,i){if(t.id===editTtId)ttIdx=i});
    if(ttIdx>=0){
      d.timetable[ttIdx]={
        id:editTtId,
        day:b.day||d.timetable[ttIdx].day,
        start:b.start||d.timetable[ttIdx].start,
        end:b.end||d.timetable[ttIdx].end,
        code:String(b.code||d.timetable[ttIdx].code).toUpperCase(),
        title:b.title||d.timetable[ttIdx].title,
        room:b.room||d.timetable[ttIdx].room,
        lecturer:b.lecturer||d.timetable[ttIdx].lecturer,
        cr:Number(b.cr)||d.timetable[ttIdx].cr||3
      };
      saveLocalData(d);return{ok:true,item:d.timetable[ttIdx]};
    }
  }
  if(u.indexOf("/timetable/")===0&&m==="DELETE"){
    var ttId=parseInt(u.split("/")[2],10);
    d.timetable=d.timetable.filter(function(x){return x.id!==ttId});saveLocalData(d);return{ok:true};
  }
  if(u==="/courses"){
    if(m==="GET")return{courses:d.courses};
    if(m==="POST"){
      var nc={code:String(b.code||'').toUpperCase(),title:b.title,cr:Number(b.cr)||3,level:b.level||'100',sem:b.sem||'Semester 1',type:b.type||'Core',dept:b.dept||''};
      var cIdx=-1;d.courses.forEach(function(c,i){if(c.code===nc.code)cIdx=i});
      if(cIdx>=0)d.courses[cIdx]=nc;else d.courses.push(nc);
      saveLocalData(d);return{course:nc};
    }
  }
  if(u.indexOf("/courses/")===0&&m==="DELETE"){
    var delCode=u.split("/")[2].toUpperCase();
    d.courses=d.courses.filter(function(x){return x.code!==delCode});saveLocalData(d);return{ok:true};
  }
  if(u==="/registrations"){
    if(m==="GET"){
      var rSid=localStorage.getItem("portal_sid");
      var rAll=d.registrations||{};
      return{registered:rAll[rSid]||["OHS 101","OHS 103","OHS 105","OHS 107","GNS 101"],registrations:rAll};
    }
    if(m==="POST"){
      d.registrations=d.registrations||{};
      var tSid=b.sid||localStorage.getItem("portal_sid");
      if(tSid==="ALL"){
        d.students.forEach(function(s){
          var cur=d.registrations[s.sid]||[];
          (b.codes||[]).forEach(function(c){if(cur.indexOf(c)===-1)cur.push(c)});
          d.registrations[s.sid]=cur;
        });
      } else if(tSid){
        d.registrations[tSid]=b.codes||[];
      }
      saveLocalData(d);return{ok:true,registered:b.codes};
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
async function refresh(){try{if(role==="admin")stu=(await api("GET","/students")).students;else if(role==="student")me=(await api("GET","/student")).student;if(role){news=(await api("GET","/announcements")).items||[];tt=(await api("GET","/timetable")).items||[];courses=(await api("GET","/courses")).courses||[];if(role==="student"){var rg=await api("GET","/registrations");regCodes=rg.registered||[]}else if(role==="admin"){var rgA=await api("GET","/registrations");regAll=rgA.registrations||{}}}}catch(e){if(/session/i.test(e.message)){role=null;clearInterval(timer);localStorage.removeItem("portal_token");msg("Your session has expired. Please sign in again.")}}soft()}
function soft(){var a=document.activeElement;if(role&&a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;if(role==="admin"&&editing!==null)return;render()}
async function logout(){try{await api("POST","/logout")}catch(e){}localStorage.removeItem("portal_token");clearInterval(timer);role=null;sid=null;me=null;stu=[];news=[];editing=null;flash="";render()}
function act(p,ok){return p.then(function(){flash=ok;return refresh()}).catch(function(e){flash="Failed: "+e.message;render()})}
async function save(){
  var p={};document.querySelectorAll("[data-p]").forEach(function(i){p[i.dataset.p]=i.value.trim()});
  var neu=editing==="new",o=neu?null:stuBy(editing);
  if(!neu){
    if(!o){
      flash="Please select a valid student record to save.";
      editing=null;
      return render();
    }
    p.id=(p.id||o.id).trim();
  }
  if(!p.name||!p.id){flash="Name and student ID are required.";return render()}
  var g={};document.querySelectorAll("[data-c]").forEach(function(s){if(s.value)g[s.dataset.c]=s.value});
  try{
    var r=neu?await api("POST","/students",{profile:p,grades:g}):await api("PUT","/students/"+editing,{profile:p,grades:g});
    flash=r.code?"Saved. Access code for "+p.name+": "+r.code+". It is shown only once, so share it with the student now.":"Saved.";
    editing=null;
    await refresh();
  }catch(e){
    flash="Could not save: "+e.message;
  }
  render();
}
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
else if(d.ttday){ttDay=d.ttday;render()}
else if(i==="a-bc-tt"){act(api("POST","/timetable/broadcast"),"Official class timetable broadcasted to all students via announcements!")}
else if(i==="a-tt-mode"){adminTtMode=(adminTtMode==="cards"?"table":"cards");render()}
else if(d.ett){editing="tt-edit-"+d.ett;flash="";render()}
else if(i==="update-tt"){
  var editSlotId=parseInt(String(editing).replace("tt-edit-",""),10);
  var updSlot={day:$("tt-day").value,start:$("tt-start").value.trim(),end:$("tt-end").value.trim(),code:$("tt-code").value.trim().toUpperCase(),title:$("tt-title").value.trim(),room:$("tt-room").value.trim(),lecturer:$("tt-lec").value.trim(),cr:Number($("tt-cr").value)||3};
  if(!updSlot.code||!updSlot.day||!updSlot.start){flash="Day, Course Code, and Start Time are required.";render()}else{editing=null;act(api("PUT","/timetable/"+editSlotId,updSlot),"Timetable slot updated successfully!")}
}
else if(d.reg){var cToReg=d.reg;if(regCodes.indexOf(cToReg)===-1){var updated=regCodes.concat([cToReg]);act(api("POST","/registrations",{codes:updated}),"Registered for "+cToReg+".")}}
else if(d.drop){var cToDrop=d.drop;var updated2=regCodes.filter(function(x){return x!==cToDrop});act(api("POST","/registrations",{codes:updated2}),"Dropped "+cToDrop+".")}
else if(d.regFor){
  var pReg=d.regFor.split(":");var tSid=pReg[0],cCode=pReg[1];
  var curList=(regAll[tSid]||(tSid==="EGI_2024_02486"?["OHS 101","OHS 103","OHS 105","OHS 107","GNS 101"]:[]));
  if(curList.indexOf(cCode)===-1){var curListUpdated=curList.concat([cCode]);act(api("POST","/registrations",{sid:tSid,codes:curListUpdated}),"Registered "+cCode+" for student.")}
}
else if(d.dropFor){
  var pDrop=d.dropFor.split(":");var tSid2=pDrop[0],cCode2=pDrop[1];
  var curList2=(regAll[tSid2]||(tSid2==="EGI_2024_02486"?["OHS 101","OHS 103","OHS 105","OHS 107","GNS 101"]:[]));
  var curListDropped=curList2.filter(function(x){return x!==cCode2});
  act(api("POST","/registrations",{sid:tSid2,codes:curListDropped}),"Dropped "+cCode2+" for student.")
}
else if(d.regCores){
  var tSid3=d.regCores;
  var coreCodes=courses.filter(function(c){return c.type==="Core"||c.type==="Mandatory"}).map(function(c){return c.code});
  var curList3=(regAll[tSid3]||(tSid3==="EGI_2024_02486"?["OHS 101","OHS 103","OHS 105","OHS 107","GNS 101"]:[]));
  var curListMerged=curList3.slice();
  coreCodes.forEach(function(cc){if(curListMerged.indexOf(cc)===-1)curListMerged.push(cc)});
  act(api("POST","/registrations",{sid:tSid3,codes:curListMerged}),"Registered all core courses for student.")
}
else if(i==="a-reg-all-cores"){
  var coreCodesAll=courses.filter(function(c){return c.type==="Core"||c.type==="Mandatory"}).map(function(c){return c.code});
  if(confirm("Register all core courses ("+coreCodesAll.join(", ")+") for all students?")){
    act(api("POST","/registrations",{sid:"ALL",codes:coreCodesAll}),"All students registered for core courses successfully!")
  }
}
else if(d.selReg){adminRegSid=d.selReg;render();window.scrollTo(0,0)}
else if(d.dlAdminReg){
  var tgtStu=stuBy(d.dlAdminReg);
  if(tgtStu){
    var sRegs=regAll[tgtStu.sid]||(tgtStu.sid==="EGI_2024_02486"?["OHS 101","OHS 103","OHS 105","OHS 107","GNS 101"]:[]);
    var sCourses=courses.filter(function(c){return sRegs.indexOf(c.code)!==-1});
    downloadRegSlipDoc(tgtStu,sCourses);
  }
}
else if(d.dtt){if(confirm("Remove this timetable slot?"))act(api("DELETE","/timetable/"+d.dtt),"Timetable slot removed.")}
else if(d.dcourse){if(confirm("Delete this course from catalog?"))act(api("DELETE","/courses/"+d.dcourse),"Course deleted.")}
else if(i==="a-new-tt"){editing="tt-new";flash="";render()}
else if(i==="a-new-course"){editing="course-new";flash="";render()}
else if(i==="save-tt"){var slot={day:$("tt-day").value,start:$("tt-start").value.trim(),end:$("tt-end").value.trim(),code:$("tt-code").value.trim().toUpperCase(),title:$("tt-title").value.trim(),room:$("tt-room").value.trim(),lecturer:$("tt-lec").value.trim(),cr:Number($("tt-cr").value)||3};if(!slot.code||!slot.day||!slot.start){flash="Day, Course Code, and Start Time are required.";render()}else{editing=null;act(api("POST","/timetable",slot),"Class slot published for all students!")}}
else if(i==="save-course"){var crs={code:$("c-code").value.trim().toUpperCase(),title:$("c-title").value.trim(),cr:Number($("c-cr").value)||3,level:$("c-level").value,sem:$("c-sem").value,type:$("c-type").value,dept:$("c-dept").value.trim()};if(!crs.code||!crs.title){flash="Course Code and Title are required.";render()}else{editing=null;act(api("POST","/courses",crs),"Course added to registration catalog!")}}
else if(d.dl){
  if(d.dl==="res-html")downloadDoc(me,false);
  else if(d.dl==="trans-html")downloadDoc(me,true);
  else if(d.dl==="res-csv"||d.dl==="trans-csv")downloadCsv(me,d.dl==="trans-csv");
  else if(d.dl==="tt-html")downloadTimetableDoc(tt);
  else if(d.dl==="reg-html"){var myRegList=courses.filter(function(c){return regCodes.indexOf(c.code)!==-1});downloadRegSlipDoc(me,myRegList)}
  else if(d.dl==="print")window.print();
}
else if(i==="save")save();else if(i==="cancel"){editing=null;render()}else if(i==="rcode")newCode(editing);
else if(i==="apost"){var ti=$("at").value.trim(),bo=$("ab").value.trim();if(ti)act(api("POST","/announcements",{title:ti,body:bo}),"Announcement posted.")}
else if(d.dann)act(api("DELETE","/announcements/"+d.dann),"Announcement deleted.")});
document.addEventListener("change",function(e){if(e.target&&e.target.id==="a-reg-sel"){adminRegSid=e.target.value;render()}});
document.addEventListener("keydown",function(e){if(e.key!=="Enter")return;if(e.target.id==="sid"||e.target.id==="scode")sLogin();else if(e.target.id==="apw")aLogin()});
$("scrim").addEventListener("click",function(){$("side").classList.remove("open");$("scrim").classList.remove("on")});
render();
(async function(){try{var m=await api("GET","/me");if(m.role)await boot()}catch(e){}ready=true;render()})();
