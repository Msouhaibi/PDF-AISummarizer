const PDFJS = window['pdfjs-dist/build/pdf'];
let pageContent = [];
let summarizedData = []
let file;

const loadPdf = async (pdfUrl) => {
    try {
        return await PDFJS.getDocument(pdfUrl).promise;
    } catch (error) {
        console.error('Error loading PDF:', error);
        throw new Error('Failed to load PDF');
    }
};
const extractTextFromPdf = async (pdf) => {
    const numPages = pdf.numPages;
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        pageContent.push({
            "pageNum": i,
            "content": pageText
        });
    }
    return pageContent;
};
const summarizeText = async (prompt) => {
    try {
        const response = await fetch(`http://localhost:3000/api/summarize?prompt="${prompt}"`);
        if (!response.ok) {
            throw new Error('Failed to get summarization response');
        }
        const data = await response.json();
        summarizedData.push(data.summary)
    }
    catch (error) {
        console.error(error);
        throw new Error('Failed to summarize text');
    }

};
document.getElementById("pdfInput").addEventListener("change", (event) => {
     file = event.target.files[0]; // Get the uploaded file
});
document.getElementById("summarize").addEventListener("click",(c)=>{
    c.preventDefault();
    var reader = new FileReader();
    if (file) {
        if(localStorage){
            if(localStorage.getItem(file.name)===null){
                reader.onload = function (e) {
                    var fileData = e.target.result;
                    loadPdf(fileData)
                        .then(pdf => {
                            if (pdf) {
                                return extractTextFromPdf(pdf);
                            }
                        })
                        .then(pageContent => {
                            if (pageContent) {
                                summarizedData = [];
                                const promises = pageContent.map(page => summarizeText(page.content));
                                return Promise.all(promises);
                            }
                        })
                        .then(() => {
                            pageContent = [];
                            console.log(summarizedData)
                            console.log("promise finished")
                        })
                        .catch(error => {
                            console.error(error);
                        });
                };
                reader.readAsArrayBuffer(file);
            }
            else{
                console.log(localStorage.getItem(file.name))
            }
        }
        else{
            // TODO  LATER A fallback IF LOCALSTORAGE IS NOT SUPPORTED
        }
    }
    else {
        alert('No file selected.');
    }
})