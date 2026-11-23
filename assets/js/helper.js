export function el(tag, { className, id, text, attrs, style } = {}, ...children) {
  const node = document.createElement(tag);
  if (className) node.className += className;
  if (id) node.id = id;
  if (text !== undefined) node.textContent = text;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  }
  if (style) Object.assign(node.style, style);
  node.append(...children);
  return node;
}


export function $(selector){
    document.querySelector(selector);
}



export function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

