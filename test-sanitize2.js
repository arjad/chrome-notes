const sanitizeHtml = require("sanitize-html");
const input = `<div>Hello <img src="data:image/png;base64,iVBORw0KGgo=" alt="test" /> World</div>`;
let sanitizedHtml = sanitizeHtml(input, {
  allowedTags: ["b", "i", "u", "p", "br", "strong", "em", "ul", "ol", "li", "div", "img"],
  allowedAttributes: {
    img: ['src', 'alt', 'width', 'height']
  },
  allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'data']
});
console.log("Without allowedSchemesByTag:", sanitizedHtml);

let sanitizedHtml2 = sanitizeHtml(input, {
  allowedTags: ["b", "i", "u", "p", "br", "strong", "em", "ul", "ol", "li", "div", "img"],
  allowedAttributes: {
    img: ['src', 'alt', 'width', 'height']
  },
  allowedSchemesByTag: {
    img: ['http', 'https', 'data']
  }
});
console.log("With allowedSchemesByTag:", sanitizedHtml2);
