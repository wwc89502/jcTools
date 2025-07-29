export function copyText(text: string, success?: () => void, fail?: (res: string) => void) {
  text = text.replace(/(^\s*)|(\s*$)/g, "");
  if (!text) {
    fail && fail("复制的内容不能为空！");
    return;
  }
  const id = "the-clipboard";
  let clipboard = (document.getElementById(id) as HTMLTextAreaElement);
  if (!clipboard) {
    clipboard = document.createElement("textarea");
    clipboard.id = id;
    clipboard.readOnly = true;
    clipboard.style.cssText = "font-size: 15px; position: fixed; top: -1000%; left: -1000%;";
    document.body.appendChild(clipboard);
  }
  clipboard.value = text;
  clipboard.select();
  clipboard.setSelectionRange(0, clipboard.value.length);
  const state = document.execCommand("copy");
  if (state) {
    success && success();
  } else {
    fail && fail("复制失败");
  }
}
