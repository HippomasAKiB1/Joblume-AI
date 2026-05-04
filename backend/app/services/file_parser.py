"""File parser for extracting text from PDF, DOCX, and TXT files."""
import io
from fastapi import UploadFile


async def parse_uploaded_file(file: UploadFile) -> str:
    content = await file.read()
    filename = file.filename or ""
    if filename.lower().endswith(".pdf"):
        return parse_pdf(content)
    elif filename.lower().endswith(".docx"):
        return parse_docx(content)
    elif filename.lower().endswith(".txt"):
        return content.decode("utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: {filename}")


def parse_pdf(content: bytes) -> str:
    import pdfplumber
    text_parts = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)


def parse_docx(content: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
