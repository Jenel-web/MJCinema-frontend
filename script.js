
// const body = document.body

// const div = document.querySelector("div")
// const spanHi = document.querySelector("#hi")
// const spanBye = document.querySelector("#bye")
// spanHi.style.color = "red"
// spanBye.style.backgroundColor = "green"

const grandparent = document.querySelector(".grandparent")
const parent = document.querySelector(".parent")
const child = document.querySelector(".child")

grandparent.addEventListener("click", (e) => {
  console.log("Grandparent");
});

parent.addEventListener("click", (e) => {
  console.log("Parent 2");
});

child.addEventListener("click", (e) => {
  console.log("Child 2");
});

document.addEventListener("click", (e) => console.log("Document 1"));grandparent.addEventListener(
  "click",
  (e) => {
    console.log("Grandparent Capture");
  },
  { capture: true }
);

parent.addEventListener("click", (e) => {
  console.log("Parent 2 Capture");
}, {capture : true});

child.addEventListener(
  "click",
  (e) => {
    console.log("Child 2 Capture");
  },
  { capture: true }
);

document.addEventListener("click", (e) => console.log("Document 1 Capture"), {
  capture: true,
});