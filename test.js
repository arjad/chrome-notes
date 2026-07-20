const sanitizeHtml = require('sanitize-html');
const html = '&nbsp; &nbsp; "html-webpack-plugin"';
const sanitizedHtml = sanitizeHtml(html, {
  allowedTags: ["b", "i", "u", "p", "br", "strong", "em", "ul", "ol", "li", "div"],
  allowedAttributes: {},
});
console.log(sanitizedHtml);
