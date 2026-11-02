import fs from "fs";
import * as pdfParseModule from "pdf-parse";

const extractText = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);

  // 1. Try class-based constructor (pdf-parse v2)
  const PDFParseClass =
    pdfParseModule.PDFParse ||
    pdfParseModule.default?.PDFParse ||
    (typeof pdfParseModule.default === "function" && pdfParseModule.default.prototype?.getText
      ? pdfParseModule.default
      : null);

  if (PDFParseClass) {
    try {
      const parser = new PDFParseClass(buffer);
      const res = await parser.getText();
      if (res && res.text) {
        return res.text;
      }
    } catch (err1) {
      console.warn("PDFParse(buffer) failed, trying PDFParse({ data: buffer }):", err1.message);
      try {
        const parser = new PDFParseClass({ data: buffer });
        const res = await parser.getText();
        if (res && res.text) {
          return res.text;
        }
      } catch (err2) {
        console.warn("PDFParse({ data: buffer }) also failed:", err2.message);
      }
    }
  }

  // 2. Try functional invocation (pdf-parse v1)
  const parseFn =
    typeof pdfParseModule.default === "function"
      ? pdfParseModule.default
      : typeof pdfParseModule === "function"
      ? pdfParseModule
      : null;

  if (parseFn) {
    try {
      const data = await parseFn(buffer);
      if (data && data.text) {
        return data.text;
      }
    } catch (err3) {
      console.error("Functional pdf-parse failed:", err3.message);
    }
  }

  throw new Error("Unable to parse PDF text. Please ensure the file is a valid non-scanned PDF.");
};

export default extractText;
