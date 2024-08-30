// const eventId = `${Math.random ()}${performance.now ()}`;
// window.addEventListener (eventId, () => {
//   const doc = document.querySelector ('.docs-texteventtarget-iframe')
//     .contentDocument;
//   const key = Object.keys (doc).find (k => k.startsWith ('closure_'));
//   const res = dig (key ? doc[key] : doc.defaultView, new Set ());
//   window.dispatchEvent (new CustomEvent (`${eventId}res`, {detail: res || ''}));
// });

// function dig (src, seen) {
//   seen.add (src);
//   if (!Array.isArray (src)) src = Object.values (src);
//   for (let v, len = src.length, i = 0; i < len; i++) {
//     try {
//       if (
//         !(v = src[i]) ||
//         Object.prototype.toString.call (v) === '[object Window]' ||
//         seen.has (v)
//       ) {
//         continue;
//       }
//     } catch (e) {}
//     seen.add (v);
//     if (
//       (typeof v === 'string' && v[0] === '\x03' && v.endsWith ('\n')) ||
//       (typeof v === 'object' && (v = dig (v, seen)))
//     ) {
//       return v;
//     }
//   }
// }
// window.dispatchEvent (new CustomEvent (eventId));
