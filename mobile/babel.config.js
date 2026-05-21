module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Com reanimated 4.x, o plugin vive em react-native-worklets/plugin.
    // Precisa ser o ÚLTIMO da lista.
    plugins: ["react-native-worklets/plugin"],
  };
};
