import { readFileSync, writeFileSync } from "fs";
import { marked } from "marked";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const md = readFileSync(join(root, "docs/PROJECT_HANDOFF.md"), "utf8");
const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BloodLink Project Handoff</title>
  <style>
    @page { margin: 18mm 16mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1d1d1f;
      max-width: 100%;
    }
    h1 { font-size: 22pt; margin-top: 0; border-bottom: 2px solid #e11d48; padding-bottom: 8px; }
    h2 { font-size: 15pt; margin-top: 24px; color: #e11d48; page-break-after: avoid; }
    h3 { font-size: 12pt; margin-top: 16px; page-break-after: avoid; }
    h4 { font-size: 11pt; margin-top: 12px; }
    p, li { orphans: 3; widows: 3; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9pt; }
    pre {
      background: #f5f5f7;
      padding: 10px 12px;
      border-radius: 6px;
      overflow-wrap: break-word;
      white-space: pre-wrap;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #d2d2d7;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #f5f5f7; font-weight: 600; }
    blockquote {
      border-left: 4px solid #e11d48;
      margin: 12px 0;
      padding: 8px 14px;
      background: #fff1f2;
      color: #444;
    }
    ul, ol { padding-left: 20px; }
    hr { border: none; border-top: 1px solid #d2d2d7; margin: 20px 0; }
    a { color: #e11d48; word-break: break-all; }
  </style>
</head>
<body>${body}</body>
</html>`;

const htmlPath = join(root, "docs/PROJECT_HANDOFF.html");
const pdfPath = join(root, "docs/PROJECT_HANDOFF.pdf");
writeFileSync(htmlPath, html);

execSync(
  `google-chrome --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "file://${htmlPath}"`,
  { stdio: "inherit" }
);

console.log("Generated:", pdfPath);
