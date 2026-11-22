# Use TypeScript, React Native, and Expo development builds

Build the iOS and Android scaffold with TypeScript and React Native using Expo development builds. This reduces initial native-project maintenance while retaining access to custom native modules for future continuous recording and speech detection; directly maintained React Native projects remain an alternative if device validation reveals a concrete limitation. Expo Go is not the compatibility target for future audio work, and framework support does not establish measurement accuracy: issue #2 must validate capture, playback interaction, timestamps, and speech detection on physical devices before real measurements are accepted.

References: [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/), [custom native code](https://docs.expo.dev/workflow/customizing/), [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/).
