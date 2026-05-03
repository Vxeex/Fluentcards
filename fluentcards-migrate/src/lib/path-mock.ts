export function join(...args: string[]) {
  // Join all arguments with a slash
  let joined = args.join('/');
  
  // Replace multiple slashes with a single slash, EXCEPT after a colon (for protocol)
  joined = joined.replace(/([^:]\/)\/+/g, "$1");
  
  // Also fix if it was just mistakenly converted from :// to :/
  joined = joined.replace(/(https?):\/([^\/])/, "$1://$2");

  return joined;
}

export function extname(str: string) {
  const match = str.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

export function dirname(str: string) {
  const match = str.match(/^(.*)\/[^\/]*$/);
  return match ? match[1] : '';
}

export function resolve(...args: string[]) {
  return join(...args);
}

export default {
  join,
  extname,
  dirname,
  resolve
};
