# Lessons Consultation

At session start and before debugging any issue, check `tasks/lessons.md` for known fixes (L001-L016).

| ID | Issue | Key Symptom |
|----|-------|-------------|
| L001 | PowerShell syntax | `&&` or heredoc failures |
| L002 | Missing dev artifacts | Module not found after clone |
| L003 | Deprecated VertexAI SDK | Never re-add @google-cloud/vertexai |
| L004 | Mojibake emoji (TS) | StrReplace fails on emoji text |
| L005 | Express 5 changes | Route/middleware oddities |
| L006 | package-lock.json | npm audit failures |
| L007 | Legacy test files | tests/ has old gmaster scripts |
| L008 | Three testing layers | Unit tests + stakeholder docs + browser UI |
| L009 | PDF generation | Use Puppeteer via md-to-pdf.js |
| L010 | Garbled emoji (HTML) | Mojibake in browser, use ftfy to fix |
| L011 | Chroma server fails | npx can't resolve Python CLI on Windows |
| L012 | Invoke-WebRequest hangs | Use curl.exe for localhost |
| L013 | npx non-npm executables | "could not determine executable to run" |
| L014 | erasableSyntaxOnly | TS1294 on parameter properties |
| L015 | Web deps missing | Run npm install in both root and web/ |
| L016 | Integration tests fail | 13 tests need running server at localhost:8090 |
