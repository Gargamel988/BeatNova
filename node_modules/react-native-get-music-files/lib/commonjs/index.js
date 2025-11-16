"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.searchSongs = exports.getAll = exports.getAlbums = exports.SortSongOrder = exports.SortSongFields = void 0;
var _reactNative = require("react-native");
const LINKING_ERROR = `The package 'react-native-music-files' doesn't seem to be linked. Make sure: \n\n` + _reactNative.Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;
const TurboSongsModule = isTurboModuleEnabled ? require('./NativeTurboSongs').default : _reactNative.NativeModules.TurboSongs;
const TurboSongs = TurboSongsModule ? TurboSongsModule : new Proxy({}, {
  get() {
    throw new Error(LINKING_ERROR);
  }
});
var SortSongOrder = exports.SortSongOrder = /*#__PURE__*/function (SortSongOrder) {
  SortSongOrder["ASC"] = "ASC";
  SortSongOrder["DESC"] = "DESC";
  return SortSongOrder;
}(SortSongOrder || {});
var SortSongFields = exports.SortSongFields = /*#__PURE__*/function (SortSongFields) {
  SortSongFields["TITLE"] = "TITLE";
  SortSongFields["DURATION"] = "DURATION";
  SortSongFields["ARTIST"] = "ARTIST";
  SortSongFields["GENRE"] = "GENRE";
  SortSongFields["ALBUM"] = "ALBUM";
  return SortSongFields;
}(SortSongFields || {});
const getAll = async options => {
  try {
    return await TurboSongs.getAll(options);
  } catch (e) {
    return `${e}`;
  }
};
exports.getAll = getAll;
const getAlbums = async options => {
  try {
    return await TurboSongs.getAlbums(options);
  } catch (e) {
    return `${e}`;
  }
};
exports.getAlbums = getAlbums;
const searchSongs = async options => {
  try {
    return await TurboSongs.search(options);
  } catch (e) {
    return `${e}`;
  }
};
exports.searchSongs = searchSongs;
//# sourceMappingURL=index.js.map