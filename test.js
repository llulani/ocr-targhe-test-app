const rects = [
  { width: 26, height: 20, x: 267, y: 330, color: "white" },
  { width: 62, height: 95, x: 514, y: 422, color: "white" },
  { width: 56, height: 99, x: 0, y: 418, color: "white" },
  { width: 579, height: 85, x: 0, y: 530, color: "white" }
];

const rects2 = rects.reduce((prev, cur, i, allRects) => {
  console.log("prev", prev)
  console.log("cur", cur)
  const tolRect = allRects.filter(r => 
    (r.x !== cur.x && r.y !== cur.y) &&
    !prev.some(r2 => r.x === r2.x && r.y === r2.y)
  ).find(r => {
      const tol = Math.abs((cur.y - r.y) / 100);
      if (tol <= 0.2) {
          return r;
      }
  });
  console.log("TOL RECT", tolRect)
  if (tolRect) {
      prev.push(cur, tolRect);
  }
  console.log("RET", prev, '\n')
  return prev;
}, []);

console.log(rects2)


// const rect = rects.reduce((prev, cur) => {
//   console.log("prev", prev)
//   console.log("cur", cur)

//   if (prev && cur.x < prev.x) {
//     cur.x = cur.x + cur.width;
//     cur.width = prev.x - cur.x;
//   } else if (prev && cur.x > prev.x) {
//     cur.width = cur.x - prev.x;
//     cur.x = prev.x;
//   }

//   if (prev && cur.y < prev.y) {
//     cur.y = cur.y + cur.width;
//     cur.height = prev.y - cur.y;
//   }

//   if (prev && prev.height && prev.height > cur.height) {
//     cur.height = prev.height;
//   }

//   console.log("new cur", cur, '\n')

//   return cur;
// }, {});

// console.log(rect)