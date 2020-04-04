module.exports = function(api) {
  api.cache(false);
  return {
    presets: [
      [
        "@babel/env",
        { modules: process.env.NODE_ENV === "test" ? "commonjs" : false }
      ]
    ],
    plugins: ["@babel/plugin-proposal-class-properties"]
  };
};
