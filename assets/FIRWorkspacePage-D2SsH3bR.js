import{j as t}from"./vendor-query-C9WzZlXd.js";import{r}from"./vendor-react-lk3K_XNh.js";import{P as D}from"./index-BN_XFMHF.js";import{T as w,B as d,I as T}from"./InputPrimitives-CMHBSpq3.js";import{C as x,B as h}from"./DisplayComponents-DYbBFXpm.js";import{E as N}from"./SharedComponents-Bl3hSizt.js";import{ah as k,k as E}from"./vendor-icons-aJgC6Fr7.js";import"./vendor-motion-Cq7HJ86I.js";const F="_container_1n8ce_1",z="_header_1n8ce_7",O="_title_1n8ce_13",B="_subtitle_1n8ce_18",M="_splitLayout_1n8ce_23",$="_listPanel_1n8ce_35",G="_listGrid_1n8ce_41",L="_listItem_1n8ce_47",W="_listItemSelected_1n8ce_63",U="_itemTitle_1n8ce_68",V="_itemMeta_1n8ce_74",H="_detailsPanel_1n8ce_80",K="_printableText_1n8ce_86",s={container:F,header:z,title:O,subtitle:B,splitLayout:M,listPanel:$,listGrid:G,listItem:L,listItemSelected:W,itemTitle:U,itemMeta:V,detailsPanel:H,printableText:K},S=[{id:"f-10291",case_number:"CASE-001",complainant:"Amit Kumar",incident_date:"2026-07-16",sections:["BNS Section 304 (Assault/Snatching)","BNS Section 324 (Hurt with Weapon)"],status:"Pending Approval",draft_text:`FIRST INFORMATION REPORT
(Under Section 154 Cr.P.C.)

1. District: South Delhi | Police Station: Sector 18
2. FIR No: 2026/00192 | Date: 2026-07-17
3. Acts & Sections:
   - Bharatiya Nyaya Sanhita (BNS) Section 304
   - Bharatiya Nyaya Sanhita (BNS) Section 324
4. Type of Incident: Robbery and Physical Assault
5. Details of Complainant:
   - Name: Amit Kumar, S/o Ram Kumar
   - Address: House 410, Sector 18, Noida
6. Incident Narrative:
   Complainant was returning from his office on foot. At approximately 11:00 PM near the crossroads, a white SUV registered under plate DL-3C-AS-8812 blocked his path. Two males got out carrying iron rods. Complainant resisted snatching of his laptop, upon which the suspects assaulted him causing blunt force injuries. Suspects fled.
`,supervisor:"Supervisor Officer",last_modified:"2026-07-17 11:20 AM",versions:[{version:1,editor:"AI Auto-Draft",date:"2026-07-16 11:58 PM"},{version:2,editor:"Investigator Priyanshu",date:"2026-07-17 11:20 AM"}]},{id:"f-10292",case_number:"CASE-002",complainant:"Sunita Devi",incident_date:"2026-07-15",sections:["BNS Section 318 (Cheating)"],status:"Registered",draft_text:`FIRST INFORMATION REPORT
(Under Section 154 Cr.P.C.)

1. District: South Delhi | Police Station: Sector 18
2. FIR No: 2026/00189 | Date: 2026-07-15
3. Acts & Sections: BNS Section 318
4. Type of Incident: Cyber Financial Fraud
5. Complainant: Sunita Devi
6. Narrative: Complainant received a phishing link requesting KYC details. Rs 45,000 was debited.
`,supervisor:"Supervisor Officer",last_modified:"2026-07-16 02:15 PM",versions:[{version:1,editor:"AI Auto-Draft",date:"2026-07-15 04:12 PM"},{version:2,editor:"Supervisor Officer",date:"2026-07-16 02:15 PM"}]}],it=()=>{const[I,g]=r.useState(S),[i,m]=r.useState(S[0]),[f,l]=r.useState(!1),[u,v]=r.useState(""),[c,b]=r.useState(""),[j,y]=r.useState(!1),_=()=>{i&&(v(i.draft_text),l(!0))},R=()=>{if(!i)return;const e=[...i.versions,{version:i.versions.length+1,editor:"Investigator Priyanshu",date:new Date().toISOString().substring(0,16).replace("T"," ")}],a={...i,draft_text:u,versions:e,last_modified:new Date().toISOString().substring(0,16).replace("T"," ")};g(n=>n.map(o=>o.id===i.id?a:o)),m(a),l(!1)},C=()=>{if(!i||!c.trim())return;const e={...i,status:"Registered",last_modified:new Date().toISOString().substring(0,16).replace("T"," ")};g(a=>a.map(n=>n.id===i.id?e:n)),m(e),y(!0)},P=e=>{switch(e){case"Registered":return t.jsx(h,{status:"success",children:"REGISTERED"});case"Pending Approval":return t.jsx(h,{status:"warning",children:"PENDING APPROVAL"});default:return t.jsx(h,{status:"info",children:e})}},A=()=>{var n,o;if(!i)return;const e=document.createElement("iframe");e.style.position="fixed",e.style.right="0",e.style.bottom="0",e.style.width="0",e.style.height="0",e.style.border="0",document.body.appendChild(e);const a=(n=e.contentWindow)==null?void 0:n.document;a&&(a.open(),a.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>FIR_${i.id}</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
            background: #ffffff;
            margin: 40px;
            padding: 0;
            line-height: 1.6;
            font-size: 14px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px double #000000;
            padding-bottom: 15px;
          }
          .logo {
            width: 70px;
            height: auto;
            margin-bottom: 8px;
          }
          .gov-title {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 4px 0;
          }
          .dept-title {
            font-size: 13px;
            font-weight: bold;
            margin: 4px 0;
          }
          .doc-title {
            font-size: 19px;
            font-weight: bold;
            text-decoration: underline;
            margin-top: 15px;
            letter-spacing: 0.5px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            margin-top: 20px;
          }
          .info-table th, .info-table td {
            border: 1px solid #000000;
            padding: 8px 12px;
            text-align: left;
            vertical-align: top;
            font-size: 13px;
          }
          .info-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            width: 32%;
          }
          .narrative-box {
            border: 1px solid #000000;
            padding: 15px;
            min-height: 200px;
            white-space: pre-wrap;
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            background-color: #fafafa;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
          }
          .signature-block {
            text-align: center;
            width: 240px;
          }
          .stamp-box {
            border: 2px solid #16a34a;
            color: #16a34a;
            border-radius: 6px;
            padding: 4px 10px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            display: inline-block;
            margin-top: 8px;
            letter-spacing: 1px;
            transform: rotate(-2deg);
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 70px;
            font-weight: bold;
            color: rgba(0, 0, 0, 0.025);
            white-space: nowrap;
            pointer-events: none;
            z-index: -1;
          }
        </style>
      </head>
      <body>
        <div class="watermark">AIPAS OFFICIAL RECORD</div>
        <div class="header">
          <img class="logo" src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" />
          <div class="gov-title">Government of India</div>
          <div class="dept-title">Ministry of Home Affairs &bull; Delhi Police Department</div>
          <div class="dept-title">South Delhi District &bull; Sector 18 Police Precinct</div>
          <div class="doc-title">FIRST INFORMATION REPORT (FIR)</div>
          <div style="font-size: 11px; margin-top: 6px; font-style: italic;">
            (Registered under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023 / Sec 154 CrPC)
          </div>
        </div>

        <table class="info-table">
          <tr>
            <th>1. FIR Reference ID</th>
            <td><strong>${i.id.toUpperCase()}</strong></td>
          </tr>
          <tr>
            <th>2. Associated Case Code</th>
            <td>${i.case_number}</td>
          </tr>
          <tr>
            <th>3. Date & Time of Compilation</th>
            <td>${i.last_modified}</td>
          </tr>
          <tr>
            <th>4. Date & Time of Occurrence</th>
            <td>${i.incident_date}</td>
          </tr>
          <tr>
            <th>5. Primary Complainant</th>
            <td>${i.complainant}</td>
          </tr>
          <tr>
            <th>6. BNS Crime Classification Codes</th>
            <td>
              <ul style="margin: 0; padding-left: 20px;">
                ${i.sections.map(p=>`<li>${p}</li>`).join("")}
              </ul>
            </td>
          </tr>
          <tr>
            <th>7. Current Registration Status</th>
            <td>${i.status.toUpperCase()}</td>
          </tr>
        </table>

        <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">8. Details of Incident and Statement Narrative:</div>
        <div class="narrative-box">${i.draft_text}</div>

        <div class="signature-section">
          <div class="signature-block">
            <div style="font-style: italic; border-bottom: 1px dashed #000000; padding-bottom: 40px; margin-bottom: 5px;"></div>
            <div style="font-size: 11px;">Complainant Signature / Thumb Impression</div>
          </div>
          <div class="signature-block">
            <div style="border-bottom: 1px dashed #000000; padding-bottom: 5px; font-weight: bold; font-size: 12px; margin-bottom: 5px;">
              ${i.status==="Registered"?"Digitally Signed by Duty Officer":"Pending Signature Authorization"}
            </div>
            <div style="font-size: 11px;">Registering Officer / Precinct Inspector</div>
            ${i.status==="Registered"?`
              <div class="stamp-box">
                AIPAS Secured<br/>
                Verified Seal
              </div>
            `:""}
          </div>
        </div>
      </body>
      </html>
    `),a.close(),(o=e.contentWindow)==null||o.focus(),setTimeout(()=>{var p;(p=e.contentWindow)==null||p.print(),setTimeout(()=>{document.body.removeChild(e)},1e3)},500))};return t.jsxs(D,{className:s.container,children:[t.jsx("div",{className:s.header,children:t.jsxs("div",{children:[t.jsx("h1",{className:s.title,children:"First Information Report (FIR) Workspace"}),t.jsx("p",{className:s.subtitle,children:"AI-Assisted FIR Compilation, Sign-off & Printable Registry"})]})}),t.jsxs("div",{className:s.splitLayout,children:[t.jsx("div",{className:s.listPanel,children:t.jsx(x,{title:"Active Case FIR Folders",children:t.jsx("div",{className:s.listGrid,children:I.map(e=>t.jsxs("div",{className:`${s.listItem} ${(i==null?void 0:i.id)===e.id?s.listItemSelected:""}`,onClick:()=>{m(e),l(!1),y(!1),b("")},children:[t.jsxs("div",{children:[t.jsxs("span",{className:s.itemTitle,children:["FIR No: ",e.id]}),t.jsxs("div",{className:s.itemMeta,children:["Case: ",e.case_number," | Complainant: ",e.complainant]})]}),P(e.status)]},e.id))})})}),t.jsx("div",{className:s.detailsPanel,children:i?t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"24px"},children:[t.jsx(x,{title:`FIR Details - ${i.id}`,actions:t.jsxs("div",{style:{display:"flex",gap:"8px"},children:[t.jsxs(d,{variant:"secondary",onClick:A,style:{padding:"6px 12px",fontSize:"12px"},children:[t.jsx(k,{size:14,style:{marginRight:"6px"}})," Print / Export"]}),!f&&i.status!=="Registered"&&t.jsx(d,{onClick:_,style:{padding:"6px 12px",fontSize:"12px"},children:"Edit Document"})]}),children:f?t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[t.jsx(w,{id:"firDraftEditor",label:"FIR Content Text",value:u,onChange:e=>v(e.target.value),rows:14}),t.jsxs("div",{style:{display:"flex",gap:"8px",alignSelf:"flex-end"},children:[t.jsx(d,{variant:"secondary",onClick:()=>l(!1),children:"Cancel"}),t.jsx(d,{onClick:R,children:"Save Revisions"})]})]}):t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[t.jsx("div",{className:s.printableText,children:i.draft_text}),t.jsxs("div",{style:{display:"flex",gap:"24px",borderTop:"1px dashed var(--card-border)",paddingTop:"12px",fontSize:"var(--text-xs)",color:"var(--muted-foreground)"},children:[t.jsxs("span",{children:[t.jsx("strong",{children:"Last Revision:"})," ",i.last_modified]}),t.jsxs("span",{children:[t.jsx("strong",{children:"Supervisor:"})," ",i.supervisor||"Unassigned"]})]})]})}),t.jsx(x,{title:"Document Revision Timeline",children:t.jsxs("table",{style:{width:"100%",fontSize:"var(--text-xs)",borderCollapse:"collapse"},children:[t.jsx("thead",{children:t.jsxs("tr",{style:{borderBottom:"1px solid var(--card-border)",textAlign:"left",color:"var(--muted-foreground)"},children:[t.jsx("th",{style:{padding:"8px"},children:"Version"}),t.jsx("th",{style:{padding:"8px"},children:"Editor Role"}),t.jsx("th",{style:{padding:"8px"},children:"Timestamp"})]})}),t.jsx("tbody",{children:i.versions.map((e,a)=>t.jsxs("tr",{style:{borderBottom:"1px solid var(--card-border)"},children:[t.jsxs("td",{style:{padding:"8px",fontWeight:"bold"},children:["v",e.version]}),t.jsx("td",{style:{padding:"8px"},children:e.editor}),t.jsx("td",{style:{padding:"8px"},children:e.date})]},a))})]})}),i.status!=="Registered"&&t.jsx(x,{title:"Digital Approval & Signature Pad",children:t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[t.jsx("p",{style:{fontSize:"var(--text-xs)",color:"var(--muted-foreground)"},children:"Enter your security credentials or signature key below to register the FIR officially in the digital record system."}),t.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"flex-end"},children:[t.jsx(T,{id:"digitalSigInput",label:"Authorized Officer Digital Signature key",placeholder:"e.g. BADGE-10827-PRIYANSHU",value:c,onChange:e=>b(e.target.value),style:{flex:1}}),t.jsxs(d,{onClick:C,disabled:!c.trim(),children:[t.jsx(E,{size:14,style:{marginRight:"8px"}})," Register FIR"]})]}),j&&t.jsxs("div",{style:{fontSize:"var(--text-xs)",color:"var(--success)",marginTop:"6px",fontWeight:"bold"},children:["✓ Document signed with key: ",c,". Status changed to Registered."]})]})})]}):t.jsx(N,{description:"Select an FIR record to verify details."})})]})]})};export{it as FIRWorkspacePage,it as default};
