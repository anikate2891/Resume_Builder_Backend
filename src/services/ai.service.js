const { z } = require("zod")
const Groq = require("groq-sdk")
const PDFDocument = require("pdfkit")

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate an interview report for a candidate with the following details:
        Resume: ${resume}
        Self Description: ${selfDescription}
        Job Description: ${jobDescription}

        Respond ONLY with a JSON object with these fields:
        {
            "matchScore": number (0-100),
            "title": "job title string",
            "technicalQuestions": [{ "question": "", "intention": "", "answer": "" }],
            "behavioralQuestions": [{ "question": "", "intention": "", "answer": "" }],
            "skillGaps": [{ "skill": "", "severity": "low|medium|high" }],
            "preparationPlan": [{ "day": 1, "focus": "", "tasks": [""] }]
        }`

    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    })

    return JSON.parse(response.choices[0].message.content)
}

async function generatePdfFromHtml(htmlContent) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument()
        const buffers = []

        doc.on("data", chunk => buffers.push(chunk))
        doc.on("end", () => resolve(Buffer.concat(buffers)))
        doc.on("error", reject)

        const plainText = htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
        doc.fontSize(12).text(plainText)
        doc.end()
    })
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate a resume for a candidate with the following details:
        Resume: ${resume}
        Self Description: ${selfDescription}
        Job Description: ${jobDescription}

        Respond ONLY with a JSON object:
        { "html": "complete HTML string of the resume" }

        The resume should be ATS friendly, professional, 1-2 pages, tailored for the job description.`

    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    })

    const jsonContent = JSON.parse(response.choices[0].message.content)
    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)
    return pdfBuffer
}

module.exports = { generateInterviewReport, generateResumePdf }