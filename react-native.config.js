module.exports = {
    project: {
      ios: {},
      android: {},
    },
    assets: ['./assets'], // path to your asset folder
    server: {
    port: 8081,
    enableHMR: true,
    useSSL: false, // Set to false for development
    rewriteRequestUrl: (url) => {
      if (!url.startsWith('http')) {
        return url;
      }
      const hostname = url.split('/')[2];
      const newUrl = url.replace(hostname, '54.169.214.143');
      return newUrl;
    },
    },
  };
  