export const getRedirectURL = () => {
  let url =
    import.meta.env.VITE_SITE_URL ?? // Set this in your .env
    "http://localhost:5173/";

  // Make sure to include `https://` when not localhost.
  url = url.includes("localhost") ? url : url.replace("http://", "https://");

  // Make sure to include a trailing `/`.
  url = url.endsWith("/") ? url : `${url}/`;

  return url;
};
