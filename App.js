import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Button, Image, Platform, ActivityIndicator } from 'react-native';

import * as Firebase from 'firebase';
import * as ImagePicker from 'expo-image-picker';

import { firebaseConfig } from './firebase';

export default function App() {

  if(!Firebase.apps.length) {
    Firebase.initializeApp(firebaseConfig);
  }

  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const { stat } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need photo library permissions to make this work!');
        } else if (stat !== 'granted') {
          alert('Sorry, we need camera permissions to make this work!');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };


  const takeImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };


  const uploadImage = async () => {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        resolve(xhr.response);
      };
      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', image, true);
      xhr.send(null);
    });

    const ref = Firebase.storage().ref().child(new Date().toISOString())
    const snapshot = ref.put(blob)

    snapshot.on(Firebase.storage.TaskEvent.STATE_CHANGED, () => {
      setUploading(true)

    },
    (error) => {
      setUploading(false)
      console.log(error)
      blob.close();
      return
    },
    () => {
      snapshot.snapshot.ref.getDownloadURL().then((url) => {
        setUploading(false)
        console.log("download url", url);
        blob.close();
        return url;
      });
    }
    );
  };


  return (
    <View style={styles.container}>
      <Image source={{uri:image}} style={{width: 300, height: 300}}/>
      <Button title="choose picture" onPress={pickImage}/>
      <Button title="take picture" onPress={takeImage}/>
      {!uploading? (
      <Button title="upload" onPress={uploadImage}/>
      ) : (
        <ActivityIndicator size="large" color="#000"/>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
