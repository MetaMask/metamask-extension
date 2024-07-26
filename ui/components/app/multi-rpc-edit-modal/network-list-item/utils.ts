const hideKeyAndHttpsFromUrl = (url: string | undefined) => {
  if (!url) return url;

  // Regex to match the protocol and rest of the URL
  const regex = /^(https?:\/\/)?(.*)$/;
  const match = url.match(regex);

  if (match) {
    let restOfUrl = match[2];

    // Remove the last segment after the last slash
    restOfUrl = restOfUrl.replace(/\/[^\/]*$/, '');

    return restOfUrl;
  }

  return url?.substring(0, url.lastIndexOf('/'));
};

export default hideKeyAndHttpsFromUrl;
