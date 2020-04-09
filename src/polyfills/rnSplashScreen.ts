function logCall(pref: string) {
  return (msg: string) => console.log(`${pref}: ${msg}`)
}

export default {
  // react-native-splash-screen
  hide: () => logCall('SplashScreen')('hide'),
}
