/* jshint esnext: true */
export default function foo(num) {
  return num > 0;
}

foo(1); // foo should hoist when defined as default export
