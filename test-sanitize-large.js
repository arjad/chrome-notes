const sanitizeHtml = require("./node_modules/sanitize-html");
const base64 = "A".repeat(2 * 1024 * 1024); // 2MB
const input = `<div>Hello <img src="data:image/png;base64,${base64}" alt="test" /> World</div>`;
let sanitizedHtml = sanitizeHtml(input, {
  allowedTags: ["b", "i", "u", "p", "br", "strong", "em", "ul", "ol", "li", "div", "img"],
  allowedAttributes: {
    img: ['src', 'alt', 'width', 'height']
  },
  allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'data']
});
console.log("Image kept:", sanitizedHtml.includes("data:image/png;base64,"));
